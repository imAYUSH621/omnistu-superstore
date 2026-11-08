import { priceFor } from './pricing';

/** Supplier quotes are inputs, not permission to publish or a profit guarantee.
 * Monetary inputs are USD cents. Null means unknown, never zero.
 * Sales tax collected for remittance is not revenue; include only seller-borne
 * tax here. A scenario must explicitly supply all costs and payment fees. */
export type CostInputs = {
  product: number | null;
  freight: number | null;
  handling: number | null;
  sellerTaxDuty: number | null;
  returnLossReserve: number | null;
};
export type PaymentFees = { percent: number | null; fixedCents: number | null };
export function assessLandedCost(costs: CostInputs, fees: PaymentFees, targetMarginPct: number) {
  const missing: string[] = [];
  let knownSubtotalCents = 0;
  for (const [key, value] of Object.entries(costs)) {
    if (value === null) { missing.push(key); continue; }
    if (!Number.isSafeInteger(value) || value < 0) throw Error(`${key} must be known non-negative integer cents or null`);
    knownSubtotalCents += value;
    if (!Number.isSafeInteger(knownSubtotalCents)) throw Error('Cost exceeds safe integer cents');
  }
  if (fees.percent === null) missing.push('paymentFeePercent');
  else if (!Number.isFinite(fees.percent) || fees.percent < 0 || fees.percent >= 100) throw Error('Invalid payment fee percentage');
  if (fees.fixedCents === null) missing.push('paymentFeeFixed');
  else if (!Number.isSafeInteger(fees.fixedCents) || fees.fixedCents < 0) throw Error('Invalid fixed payment fee');
  if (!Number.isFinite(targetMarginPct) || targetMarginPct < 0 || targetMarginPct >= 100) throw Error('Invalid target margin');
  if (missing.length) return { status: 'incomplete' as const, knownSubtotalCents, landedCostCents: null, missing, scenario: null };
  const scenario = priceFor(knownSubtotalCents / 100, 0, { feePct: fees.percent!, feeFixed: fees.fixedCents! / 100, minMarginPct: targetMarginPct });
  return { status: 'costed-scenario' as const, knownSubtotalCents, landedCostCents: knownSubtotalCents, missing, scenario };
}
