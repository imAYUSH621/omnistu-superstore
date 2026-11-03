import { prisma } from '@/db/prisma';

/**
 * Best-effort durable marker for "PayPal capture COMPLETED but the order could not be marked paid".
 * Writes only while the order is still unpaid and never overwrites an existing mismatch note.
 * If the DB itself is down this write fails too: the capture id is then only in the server log
 * (and in PayPal), which is the residual risk. It performs no refund and no retry.
 */
export async function recordCapturedUnsettled(
  orderId: string,
  captureId: string,
  amount: string | undefined,
  cause: unknown
): Promise<void> {
  const reason = cause instanceof Error ? cause.message : String(cause);
  if (/already paid/i.test(reason)) return; // a concurrent call settled it: nothing to reconcile
  console.error(`[payments] CAPTURED_UNSETTLED order ${orderId} capture ${captureId} amount ${amount}: ${reason}`);
  try {
    const note = `CAPTURED_UNSETTLED: PayPal capture ${captureId} COMPLETED (${amount ?? 'unknown'}) but settlement failed: ${reason}`.slice(0, 500);
    await prisma.order.updateMany({
      where: { id: orderId, isPaid: false, OR: [{ paymentNote: null }, { paymentNote: '' }] },
      data: { paymentNote: note },
    });
  } catch (e) {
    console.error(`[payments] could not record CAPTURED_UNSETTLED for order ${orderId}:`, e instanceof Error ? e.message : e);
  }
}
