/** Any attempted/uncertain payment stays closed until a person reconciles it. No timed expiry. */
export const PAYMENT_REVIEW_MARKERS = [
  'CAPTURE_REQUESTED', 'PAYPAL_CREATE_REQUESTED', 'CAPTURED_UNSETTLED',
  'CAPTURE_UNCONFIRMED', 'CAPTURE_PENDING', 'AMOUNT_MISMATCH', 'CURRENCY_MISMATCH',
] as const;

export const PAYMENT_REVIEW_MESSAGE = 'This payment needs to be checked before another attempt. Please do not pay again.';

export function needsPaymentReview(note: string | null | undefined): boolean {
  return PAYMENT_REVIEW_MARKERS.some(marker => note?.includes(marker));
}
