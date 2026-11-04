import type { Prisma } from '@prisma/client';

/** Passive incident evidence, NEVER a runnable outbox job. No personal payload or retry permission. */
export const PAYMENT_EFFECT_REVIEW_STATUS = 'REVIEW_ONLY';
export async function recordPaymentEffectsForReview(tx: { fulfillmentTask: { create: (args: { data: Prisma.FulfillmentTaskUncheckedCreateInput }) => PromiseLike<unknown> } }, orderId: string) {
  return tx.fulfillmentTask.create({ data: {
    orderId,
    supplier: 'PAYMENT_EFFECT_REVIEW',
    status: PAYMENT_EFFECT_REVIEW_STATUS,
    maxAttempts: 0,
    payload: {
      kind: 'PAYMENT_EFFECT_OUTCOMES_UNCONFIRMED',
      effects: ['confirmation_email', 'purchase_receipt', 'cloud_mirror', 'supplier_dispatch'],
      guidance: 'Some effects may be disabled, completed, failed or not started. Check each source before acting. This record grants no retry or resend permission.',
    },
  } });
}
