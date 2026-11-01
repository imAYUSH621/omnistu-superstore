/**
 * Read-only reconciliation of PAID orders whose post-payment effects may not have completed.
 *
 * Why this exists: after the paid transaction commits, supplier dispatch, the confirmation email
 * and the Supabase mirror run as fire-and-forget promises with no outbox row. A crash or serverless
 * freeze in that window leaves a paid order with no dispatch record. This module only READS the
 * order rows and classifies them. It never calls a supplier, never retries, never writes.
 *
 * Unknown supplier outcome: a paid order with no dispatch record, or a failed/partial dispatch, may
 * still have been ACCEPTED by a supplier (the dispatcher sends no idempotency key). Never retry
 * blindly: check the supplier dashboard for the order first.
 */
export const DISPATCH_GRACE_MS = 15 * 60_000;

export type ReconcileReason = 'NO_DISPATCH_RECORD' | 'DISPATCH_NOT_COMPLETE';

export interface PaidOrderRow {
  id: string;
  isPaid: boolean;
  paidAt: Date | null;
  dispatchStatus: string | null;
  dispatchError: string | null;
  supplierOrderId: string | null;
}

export interface ReconcileItem {
  orderId: string;
  paidAt: string | null;
  reason: ReconcileReason;
  dispatchStatus: string | null;
  dispatchError: string | null;
  supplierOrderId: string | null;
  guidance: string;
}

const GUIDANCE =
  'Supplier outcome is UNKNOWN. Do not retry automatically. Check the supplier dashboard for this order first; only dispatch manually if no supplier order exists.';

export function classifyPaidOrder(o: PaidOrderRow, now = new Date()): ReconcileItem | null {
  if (!o.isPaid) return null;
  const base = {
    orderId: o.id,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    dispatchStatus: o.dispatchStatus,
    dispatchError: o.dispatchError,
    supplierOrderId: o.supplierOrderId,
    guidance: GUIDANCE,
  };
  if (o.dispatchStatus == null) {
    // Inside the grace window the background dispatch may simply still be running.
    if (o.paidAt && now.getTime() - o.paidAt.getTime() < DISPATCH_GRACE_MS) return null;
    return { ...base, reason: 'NO_DISPATCH_RECORD' };
  }
  if (o.dispatchStatus !== 'DISPATCHED') return { ...base, reason: 'DISPATCH_NOT_COMPLETE' };
  return null;
}

export async function findPaidOrdersNeedingAttention(
  db: { order: { findMany: (args: unknown) => Promise<PaidOrderRow[]> } },
  now = new Date(),
  limit = 200
): Promise<ReconcileItem[]> {
  const rows = await db.order.findMany({
    where: { isPaid: true, OR: [{ dispatchStatus: null }, { dispatchStatus: { not: 'DISPATCHED' } }] },
    select: { id: true, isPaid: true, paidAt: true, dispatchStatus: true, dispatchError: true, supplierOrderId: true },
    orderBy: { paidAt: 'asc' },
    take: limit,
  });
  return rows.map((r) => classifyPaidOrder(r, now)).filter((x): x is ReconcileItem => x !== null);
}
