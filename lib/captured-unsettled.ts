import { prisma } from '@/db/prisma';

/**
 * Best-effort durable marker for "PayPal capture COMPLETED but the order could not be marked paid".
 * Writes only while the order is still unpaid and never overwrites an existing mismatch note.
 * If the DB itself is down this write fails too: the capture id is then only in the server log
 * (and in PayPal), which is the residual risk. It performs no refund and no retry.
 */
/** Bounded reason codes: raw error text (which can carry DB details) is never stored or logged. */
export type UnsettledReason = 'ORDER_MISSING' | 'AMOUNT_MISMATCH' | 'DB_ERROR' | 'UNKNOWN';

export function classifyUnsettledReason(cause: unknown): UnsettledReason | 'ALREADY_PAID' {
  // Database-client errors first: their message embeds source code snippets (which can contain the
  // words "already paid" or "not found"), so message matching must never run on them.
  const name = cause instanceof Error ? cause.name : '';
  const code = (cause as { code?: unknown } | null)?.code;
  if (name.startsWith('PrismaClient') || (typeof code === 'string' && /^P\d{4}$/.test(code))) return 'DB_ERROR';
  const m = cause instanceof Error ? cause.message : '';
  if (/already paid/i.test(m)) return 'ALREADY_PAID';
  if (/not found/i.test(m)) return 'ORDER_MISSING';
  if (/does not match/i.test(m)) return 'AMOUNT_MISMATCH';
  return 'UNKNOWN';
}

export async function recordCapturedUnsettled(
  orderId: string,
  captureId: string,
  amount: string | undefined,
  cause: unknown
): Promise<void> {
  const reason = classifyUnsettledReason(cause);
  if (reason === 'ALREADY_PAID') return; // a concurrent call settled it: nothing to reconcile
  const cap = String(captureId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  const amt = String(amount ?? 'unknown').replace(/[^0-9.]/g, '').slice(0, 14) || 'unknown';
  console.error(`[payments] CAPTURED_UNSETTLED order ${orderId} capture ${cap} reason ${reason}`);
  try {
    const marker = `CAPTURED_UNSETTLED reason=${reason} capture=${cap} amount=${amt} - needs manual review, no refund or retry performed`;
    // Compare-and-set append (paymentNote is Postgres text, no length limit): keep any earlier note, whole, (e.g. AMOUNT_MISMATCH or CURRENCY_MISMATCH) and add the
    // incident after it. A concurrent writer changing the note between read and write makes the update a
    // no-op, so one retry re-reads. Never overwrites, never touches a paid order.
    for (let attempt = 0; attempt < 2; attempt++) {
      const row = await prisma.order.findFirst({ where: { id: orderId, isPaid: false }, select: { paymentNote: true } });
      if (!row) return;
      const prior = row.paymentNote ?? '';
      if (prior.includes(`capture=${cap}`) && prior.includes('CAPTURED_UNSETTLED')) return; // already recorded
      const next = prior ? `${prior} | ${marker}` : marker; // paymentNote is unbounded text: never truncate prior content
      const res = await prisma.order.updateMany({
        where: prior === ''
          ? { id: orderId, isPaid: false, OR: [{ paymentNote: null }, { paymentNote: '' }] }
          : { id: orderId, isPaid: false, paymentNote: prior },
        data: { paymentNote: next },
      });
      if (res.count === 1) return;
    }
    console.error(`[payments] CAPTURED_UNSETTLED note for order ${orderId} lost a write race twice`);
  } catch {
    console.error(`[payments] could not record CAPTURED_UNSETTLED for order ${orderId}`);
  }
}
