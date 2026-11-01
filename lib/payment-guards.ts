/**
 * Payment verification helpers (D12).
 * Pure functions so the rules are unit-testable without a database.
 */

/**
 * Parse a USD amount into integer cents. Accepts only plain decimals with at most two fraction
 * digits (what PayPal USD captures and Postgres Decimal(12,2) totals look like). Returns null for
 * anything else so the caller fails closed.
 */
export function toMinorUnits(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const str = typeof value === 'number' ? (Number.isFinite(value) ? value.toFixed(2) : '') : value.trim();
  const m = /^(-?)(\d{1,10})(?:\.(\d{1,2}))?$/.exec(str);
  if (!m) return null;
  const cents = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0') || '0');
  return m[1] ? -cents : cents;
}

/**
 * True unless the captured amount equals the order total to the cent. Orders store totalPrice as
 * Decimal(12,2) and Stripe/PayPal USD amounts are exact cents, so there is no rounding noise to
 * absorb: any difference, including 1 cent, is an under- or over-payment. Unparseable input
 * counts as a mismatch. (The earlier 1-cent tolerance came from float arithmetic and had no
 * business rationale in the code.)
 */
export function isAmountMismatch(
  pricePaid: string | number | null | undefined,
  expectedTotal: string | number
): boolean {
  if (pricePaid == null || pricePaid === '') return false; // nothing captured to compare; callers must fail closed first
  const paid = toMinorUnits(pricePaid);
  const expected = toMinorUnits(typeof expectedTotal === 'number' ? expectedTotal : String(expectedTotal));
  if (paid === null || expected === null) return true;
  return paid !== expected;
}

/** Stable comparison of two carts/order item lists for duplicate detection (D11). */
export function sameLineItems(
  a: { productId: string; qty: number }[],
  b: { productId: string; qty: number }[]
): boolean {
  if (a.length !== b.length) return false;
  return a.every((x) => b.some((y) => y.productId === x.productId && y.qty === x.qty));
}

/** Stripe amounts are integer minor units; keep both decimals (toFixed() with no digits rounds 42.50 to 43). */
export function stripeMinorToAmount(minor: number): string {
  return (minor / 100).toFixed(2);
}

/** The store prices every order in USD; a capture in any other currency must not mark an order paid. */
export function isExpectedCurrency(currency: string | null | undefined, expected = 'USD'): boolean {
  return typeof currency === 'string' && currency.toUpperCase() === expected;
}
