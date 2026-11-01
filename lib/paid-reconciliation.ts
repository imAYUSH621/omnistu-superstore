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

export interface ReconcileCursor {
  paidAt: string | null;
  id: string;
}

export interface ReconcilePage {
  items: ReconcileItem[];
  /** Pass back as `after` to read the next page; null when this is the last page. */
  nextCursor: ReconcileCursor | null;
}

type Db = { order: { findMany: (args: unknown) => Promise<PaidOrderRow[]> } };

/**
 * One page of paid orders needing attention, oldest first, in a stable order (paidAt, id).
 * Orders still inside the grace window are filtered in the query so they cannot use up page
 * slots. A full page returns a cursor, so no order is unreachable however many are older.
 */
export async function findPaidOrdersNeedingAttentionPage(
  db: Db,
  opts: { now?: Date; limit?: number; after?: ReconcileCursor | null } = {}
): Promise<ReconcilePage> {
  const now = opts.now ?? new Date();
  const limit = opts.limit ?? 200;
  const cutoff = new Date(now.getTime() - DISPATCH_GRACE_MS);
  const and: unknown[] = [
    {
      OR: [
        { dispatchStatus: { not: 'DISPATCHED' } },
        { dispatchStatus: null, OR: [{ paidAt: null }, { paidAt: { lt: cutoff } }] },
      ],
    },
  ];
  const a = opts.after;
  if (a) {
    const t = a.paidAt ? new Date(a.paidAt) : null;
    and.push(
      t
        ? { OR: [{ paidAt: { gt: t } }, { paidAt: t, id: { gt: a.id } }] }
        : { OR: [{ paidAt: null, id: { gt: a.id } }, { paidAt: { not: null } }] }
    );
  }
  const rows = await db.order.findMany({
    where: { isPaid: true, AND: and },
    select: { id: true, isPaid: true, paidAt: true, dispatchStatus: true, dispatchError: true, supplierOrderId: true },
    orderBy: [{ paidAt: { sort: 'asc', nulls: 'first' } }, { id: 'asc' }],
    take: limit + 1,
  });
  const more = rows.length > limit;
  const pageRows = more ? rows.slice(0, limit) : rows;
  const last = pageRows[pageRows.length - 1];
  return {
    items: pageRows.map((r) => classifyPaidOrder(r, now)).filter((x): x is ReconcileItem => x !== null),
    nextCursor: more && last ? { paidAt: last.paidAt ? last.paidAt.toISOString() : null, id: last.id } : null,
  };
}

/** First page only. Use findPaidOrdersNeedingAttentionPage to reach orders beyond it. */
export async function findPaidOrdersNeedingAttention(db: Db, now = new Date(), limit = 200): Promise<ReconcileItem[]> {
  return (await findPaidOrdersNeedingAttentionPage(db, { now, limit })).items;
}
