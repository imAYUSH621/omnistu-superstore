/**
 * Payment verification helpers (D12).
 * Pure functions so the rules are unit-testable without a database.
 */

/** True when the captured amount disagrees with the order total (>1 cent). */
export function isAmountMismatch(
  pricePaid: string | number | null | undefined,
  expectedTotal: number
): boolean {
  if (pricePaid == null || pricePaid === '') return false; // nothing captured to compare
  const paid = Number(pricePaid);
  if (!Number.isFinite(paid)) return true;
  return Math.abs(paid - expectedTotal) > 0.01;
}

/** Stable comparison of two carts/order item lists for duplicate detection (D11). */
export function sameLineItems(
  a: { productId: string; qty: number }[],
  b: { productId: string; qty: number }[]
): boolean {
  if (a.length !== b.length) return false;
  return a.every((x) => b.some((y) => y.productId === x.productId && y.qty === x.qty));
}
