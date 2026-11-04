import { prisma } from '@/db/prisma';

/**
 * Best-effort durable marker for "PayPal capture COMPLETED but the order could not be marked paid".
 * Writes only while the order is still unpaid and never overwrites an existing mismatch note.
 * If the DB itself is down this write fails too: the capture id is then only in the server log
 * (and in PayPal), which is the residual risk. It performs no refund and no retry.
 */
/** Bounded reason codes: raw error text (which can carry DB details) is never stored or logged. */
export type UnsettledReason = 'ORDER_MISSING' | 'AMOUNT_MISMATCH' | 'DB_ERROR' | 'UNKNOWN' | 'STOCK_UNAVAILABLE';
export type IncidentKind = 'CAPTURED_UNSETTLED' | 'CAPTURE_UNCONFIRMED' | 'CAPTURE_PENDING';

export function classifyUnsettledReason(cause: unknown): UnsettledReason | 'ALREADY_PAID' {
  // Typed errors only. Message text is never matched: database-client errors embed source snippets
  // that can contain any phrase.
  const code = (cause as { settlementCode?: unknown } | null)?.settlementCode;
  if (code === 'ALREADY_PAID' || code === 'ORDER_MISSING' || code === 'AMOUNT_MISMATCH' || code === 'STOCK_UNAVAILABLE') return code;
  return DB_ERROR_RE(cause) ? 'DB_ERROR' : 'UNKNOWN';
}

function DB_ERROR_RE(cause: unknown): boolean {
  const name = cause instanceof Error ? cause.name : '';
  const code = (cause as { code?: unknown } | null)?.code;
  return name.startsWith('PrismaClient') || (typeof code === 'string' && /^P\d{4}$/.test(code));
}

export async function recordCapturedUnsettled(
  orderId: string,
  captureId: string,
  amount: string | undefined,
  cause: unknown,
  kind: IncidentKind = 'CAPTURED_UNSETTLED',
  reasonOverride?: string
): Promise<void> {
  const classified = classifyUnsettledReason(cause);
  // "already paid" is benign only when the database really shows the order paid; the writes below are
  // scoped to isPaid:false, so a genuinely paid order is never touched either way.
  const reason = reasonOverride ? reasonOverride.replace(/[^A-Z_0-9]/g, '').slice(0, 30) : classified;
  const cap = String(captureId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  const amt = String(amount ?? 'unknown').replace(/[^0-9.]/g, '').slice(0, 14) || 'unknown';
  console.error(`[payments] ${kind} order ${orderId} capture ${cap} reason ${reason}`);
  try {
    const marker = `${kind} reason=${reason} capture=${cap} amount=${amt} - needs manual review, no refund or retry performed`;
    // Compare-and-set append (paymentNote is Postgres text, no length limit): keep any earlier note, whole, (e.g. AMOUNT_MISMATCH or CURRENCY_MISMATCH) and add the
    // incident after it. A concurrent writer changing the note between read and write makes the update a
    // no-op, so one retry re-reads. Never overwrites, never touches a paid order.
    for (let attempt = 0; attempt < 2; attempt++) {
      const row = await prisma.order.findFirst({ where: { id: orderId, isPaid: false }, select: { paymentNote: true } });
      if (!row) return;
      const prior = row.paymentNote ?? '';
      if (prior.includes(`capture=${cap}`) && prior.includes(kind)) return; // already recorded
      const next = prior ? `${prior} | ${marker}` : marker; // paymentNote is unbounded text: never truncate prior content
      const res = await prisma.order.updateMany({
        where: prior === ''
          ? { id: orderId, isPaid: false, OR: [{ paymentNote: null }, { paymentNote: '' }] }
          : { id: orderId, isPaid: false, paymentNote: prior },
        data: { paymentNote: next },
      });
      if (res.count === 1) return;
    }
    console.error(`[payments] ${kind} note for order ${orderId} lost a write race twice`);
  } catch {
    console.error(`[payments] could not record ${kind} for order ${orderId}`);
  }
}
