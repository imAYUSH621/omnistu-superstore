'use server';

import { auth } from '@/auth';
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
  if (!order.isPaid) {
    return { success: false, message: 'Only paid orders can be returned.' };
  }

  const existing = await prisma.returnRequest.findFirst({
    where: { orderId, status: { in: ['REQUESTED', 'APPROVED'] } },
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

  if (approve) {
    // Atomic claim: exactly one concurrent approval can flip REQUESTED ->
    // PROCESSING. A second concurrent call sees count 0 and stops here, so
    // a double-click or parallel admin sessions can never issue two
    // refunds for the same return.
    const claimed = await prisma.returnRequest.updateMany({
      where: { id: returnId, status: 'REQUESTED' },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count === 0) {
      return { success: false, message: 'Return already being processed by another approval.' };
    }
  }

  if (!approve) {
    await prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'REJECTED', resolutionNote: note?.trim() || null },
    });
    return { success: true, message: 'Return rejected.' };
  }

  // Approve = run the fail-closed refund path (lib/refunds.ts). Without
  // live keys + REFUNDS_LIVE_ENABLED this records SIMULATED; a provider
  // error records FAILED. No path claims money moved when none did.
  const supplierNote = rr.order.dispatchSupplier
    ? 'Supplier RMA must be initiated manually - supplier return API scope not settled.'
    : null;
  // Cumulative-refund guard: sum refunds already EXECUTED on this order so
  // sequential returns can never refund more than the order total.
  const prior = await prisma.returnRequest.findMany({
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
  await prisma.returnRequest.update({
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
  // UNKNOWN means the provider call's outcome is uncertain (possible
  // timeout after success). Alert monitoring (no-op unless configured)
  // and surface it for manual reconciliation - never blind-retry.
  if (refund.status === 'UNKNOWN' || refund.status === 'FAILED') {
    await reportEvent({
      event: 'refund.uncertain',
      level: refund.status === 'UNKNOWN' ? 'critical' : 'warning',
      detail: `return ${returnId}: ${refund.note}`,
    });
  }
  return {
    success: refund.status !== 'FAILED',
    message: `Return approved - refund ${refund.status.toLowerCase()}: ${refund.note}`,
    returnId,
  };
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
