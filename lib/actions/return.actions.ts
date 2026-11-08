'use server';

import { auth } from '@/auth';
import { isSimulatedOrder } from '@/lib/order-simulation';
import { executeRefund } from '@/lib/refunds';
import { reportEvent } from '@/lib/monitoring';
import { prisma } from '@/db/prisma';

/**
 * Returns / RMA flow (G3). Refund execution lives in lib/refunds.ts and is
 * fail-closed: approving a return runs executeRefund, which only calls a
 * payment provider when REFUNDS_LIVE_ENABLED=true AND live keys exist AND
 * the order has a provider reference. Otherwise it records SIMULATED or
 * FAILED with the exact reason - never a claim that money moved when none
 * did. Live refunds additionally wait on the owner approving the draft
 * refund policy. Supplier-return handling is tracked as a status, not
 * executed: supplier RMA must be initiated manually until supplier API
 * scope is settled.
 */

type ActionResult = { success: boolean; message: string; returnId?: string };

export async function requestReturn(orderId: string, reason: string): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, message: 'You must be signed in.' };
  if (!reason || reason.trim().length < 10) {
    return { success: false, message: 'Please describe the reason (at least 10 characters).' };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) {
    return { success: false, message: 'Order not found.' };
  }
  if (isSimulatedOrder(order)) {
    return { success: false, message: 'Test orders cannot create a real return or refund request.' };
  }
  if (!order.isPaid) {
    return { success: false, message: 'Only paid orders can be returned.' };
  }

  const existing = await prisma.returnRequest.findFirst({
    where: { orderId, status: { in: ['REQUESTED', 'PROCESSING', 'APPROVED'] } },
  });
  if (existing) {
    return { success: false, message: 'A return request already exists for this order.', returnId: existing.id };
  }

  const rr = await prisma.returnRequest.create({
    data: { orderId, userId, reason: reason.trim() },
  });
  return { success: true, message: 'Return requested. This is a demo store - the request is recorded but no refund is processed.', returnId: rr.id };
}

export async function reviewReturn(
  returnId: string,
  approve: boolean,
  note?: string
): Promise<ActionResult> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { success: false, message: 'Admin access required.' };

  const rr = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true },
  });
  if (!rr) return { success: false, message: 'Return request not found.' };
  if (rr.status !== 'REQUESTED') {
    return { success: false, message: `Return already ${rr.status.toLowerCase()}.` };
  }

  if (!approve) {
    await prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'REJECTED', resolutionNote: note?.trim() || null },
    });
    return { success: true, message: 'Return rejected.' };
  }

  if (approve && isSimulatedOrder(rr.order)) {
    return { success: false, message: 'Test orders cannot be approved for a real return or refund.' };
  }

  if (approve) {
    // Step 1 - durable claim, committed on its own BEFORE any provider
    // contact: exactly one approval can flip REQUESTED -> PROCESSING.
    // Because this commit is separate from the refund transaction, a
    // provider timeout, statement timeout, crash, or rollback later in
    // the flow can never release the lock: the return stays PROCESSING,
    // which blocks retries, new returns on the order, and re-approval
    // until an admin reconciles against the provider.
    const claimed = await prisma.returnRequest.updateMany({
      where: { id: returnId, status: 'REQUESTED' },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count === 0) {
      return { success: false, message: 'Return already being processed by another approval.' };
    }

    const supplierNote = rr.order.dispatchSupplier
      ? 'Supplier RMA must be initiated manually - supplier return API scope not settled.'
      : null;

    // Step 2 - the refund itself, serialized per order: a Postgres
    // advisory lock on the order id makes concurrent approvals of
    // DIFFERENT returns on the same order run one at a time, so the
    // cumulative cap is read and applied atomically per order, never
    // per return. The provider call runs inside the lock; that
    // serializes same-order refunds for up to one provider round-trip,
    // which is the price of a race-free cap.
    try {
      return await prisma.$transaction(async (tx) => {
        // $executeRaw: the lock function returns void, which $queryRaw cannot deserialize
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${rr.orderId}))`;

        // Cumulative-refund guard INSIDE the order lock.
        const prior = await tx.returnRequest.findMany({
          where: { orderId: rr.orderId, refundStatus: 'EXECUTED' },
          select: { refundAmount: true },
        });
        const alreadyRefunded = prior.reduce((a, r) => a + Number(r.refundAmount ?? 0), 0);
        const refund = await executeRefund({
          paymentMethod: rr.order.paymentMethod,
          paymentResult: rr.order.paymentResult,
          amount: Number(rr.order.totalPrice),
          orderTotal: Number(rr.order.totalPrice),
          alreadyRefunded,
          idempotencyKey: `return-${returnId}`,
        });

        // UNKNOWN means the provider call's outcome is uncertain
        // (possible timeout after success). Alert monitoring (no-op
        // unless configured) and surface it for manual reconciliation -
        // never blind-retry. UNKNOWN/FAILED do not count toward the
        // cumulative cap.
        if (refund.status === 'UNKNOWN' || refund.status === 'FAILED') {
          await reportEvent({
            event: 'refund.uncertain',
            level: refund.status === 'UNKNOWN' ? 'critical' : 'warning',
            detail: `return ${returnId}: ${refund.note}`,
          });
        }

        // Record the outcome. If the provider EXECUTED but this write
        // fails, the money may already have moved: alert critical and
        // return a reconcile message instead of throwing. The durable
        // PROCESSING claim from step 1 survives and locks the return.
        try {
          await tx.returnRequest.update({
            where: { id: returnId },
            data: {
              status: 'APPROVED',
              refundAmount: rr.order.totalPrice,
              refundStatus: refund.status,
              refundProviderRef: refund.providerRef ?? null,
              supplierReturnStatus: rr.order.dispatchSupplier ? 'PENDING_MANUAL' : 'NOT_REQUIRED',
              resolutionNote: [refund.note, supplierNote, note?.trim()].filter(Boolean).join(' '),
            },
          });
        } catch (writeErr) {
          if (refund.status === 'EXECUTED') {
            await reportEvent({
              event: 'refund.record_failed',
              level: 'critical',
              detail: `return ${returnId}: provider refund ${refund.providerRef} EXECUTED but recording failed (${writeErr instanceof Error ? writeErr.message : String(writeErr)}). Return stays PROCESSING; reconcile manually.`,
            });
            return {
              success: false,
              message: `CRITICAL: refund ${refund.providerRef} executed at the provider but recording it failed. The return is locked in PROCESSING - reconcile against the provider before touching this order again.`,
              returnId,
            };
          }
          throw writeErr;
        }
        return {
          success: refund.status !== 'FAILED',
          message: `Return approved - refund ${refund.status.toLowerCase()}: ${refund.note}`,
          returnId,
        };
      });
    } catch (txErr) {
      // The refund transaction aborted (e.g. statement timeout while the
      // provider call was in flight, DB failure). The provider outcome
      // is UNCERTAIN - it may have succeeded. The step-1 claim keeps the
      // return durably PROCESSING: no retry, no new return, no
      // re-approval until manual reconciliation.
      await reportEvent({
        event: 'refund.uncertain',
        level: 'critical',
        detail: `return ${returnId}: refund transaction aborted (${txErr instanceof Error ? txErr.message : String(txErr)}). Provider outcome uncertain; return locked PROCESSING - reconcile with idempotency key return-${returnId}.`,
      });
      return {
        success: false,
        message: `Refund outcome UNCERTAIN - the refund transaction aborted (${txErr instanceof Error ? txErr.message : 'database error'}). The provider may have charged the refund. The return is locked in PROCESSING; reconcile against the provider using idempotency key return-${returnId} before any retry.`,
        returnId,
      };
    }
  }
  // Unreachable: approve returns inside the transaction, !approve returned above.
  return { success: false, message: 'Unexpected return review state.' };
}

export async function getMyReturns(): Promise<{ success: boolean; data?: unknown[]; message?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, message: 'You must be signed in.' };
  const data = await prisma.returnRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { success: true, data };
}

export async function getAllReturns(): Promise<{ success: boolean; data?: unknown[]; message?: string }> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') return { success: false, message: 'Admin access required.' };
  const data = await prisma.returnRequest.findMany({
    include: {
      order: { select: { id: true, totalPrice: true, isPaid: true, dispatchSupplier: true, createdAt: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return { success: true, data: JSON.parse(JSON.stringify(data)) };
}
