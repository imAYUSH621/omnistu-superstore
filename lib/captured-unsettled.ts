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
  const m = cause instanceof Error ? cause.message : '';
  if (/already paid/i.test(m)) return 'ALREADY_PAID';
  if (/not found/i.test(m)) return 'ORDER_MISSING';
  if (/does not match/i.test(m)) return 'AMOUNT_MISMATCH';
  const code = (cause as { code?: unknown } | null)?.code;
  if (typeof code === 'string' && /^P\d{4}$/.test(code)) return 'DB_ERROR';
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
    const note = `CAPTURED_UNSETTLED reason=${reason} capture=${cap} amount=${amt} - needs manual review, no refund or retry performed`;
    await prisma.order.updateMany({
      where: { id: orderId, isPaid: false, OR: [{ paymentNote: null }, { paymentNote: '' }] },
      data: { paymentNote: note },
    });
  } catch {
    console.error(`[payments] could not record CAPTURED_UNSETTLED for order ${orderId}`);
  }
}
