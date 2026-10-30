export interface PricingConfig {
  feePct: number; // payment processor percentage, e.g. 2.9
  feeFixed: number; // payment processor fixed fee in USD, e.g. 0.30
  minMarginPct: number; // minimum margin you accept, e.g. 30
}

export function pricingConfigFromEnv(env: NodeJS.ProcessEnv = process.env): PricingConfig {
  const num = (v: string | undefined, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && v !== undefined && v !== '' ? n : fallback;
  };
  return {
    feePct: num(env.PAYMENT_FEE_PCT, 2.9),
    feeFixed: num(env.PAYMENT_FEE_FIXED, 0.3),
    minMarginPct: num(env.MIN_MARGIN_PCT, 30),
  };
}

export interface PriceResult {
  retailPrice: number;
  marginPct: number;
  profit: number;
}

/**
 * Retail price that still leaves `minMarginPct` after product cost, shipping
 * and payment fees. Rounded up to the next x.99. Shipping is an input you must
 * get from the supplier quote for the destination; it is NOT guessed here.
 */
export function priceFor(
  wholesaleCost: number,
  shippingCost: number,
  cfg: PricingConfig = pricingConfigFromEnv(),
): PriceResult {
  const feeRate = cfg.feePct / 100;
  const marginRate = cfg.minMarginPct / 100;
  if (feeRate + marginRate >= 1) {
    throw new Error('PAYMENT_FEE_PCT + MIN_MARGIN_PCT must be below 100');
  }
  const safeCost = Math.max(0, Number.isFinite(wholesaleCost) ? wholesaleCost : 0);
  const safeShipping = Math.max(0, Number.isFinite(shippingCost) ? shippingCost : 0);
  const base = safeCost + safeShipping + cfg.feeFixed;
  const raw = base / (1 - feeRate - marginRate);
  const retailPrice = Math.max(Math.ceil(raw) - 0.01, 0.99);
  const profit = retailPrice - base - retailPrice * feeRate;
  return {
    retailPrice: Number(retailPrice.toFixed(2)),
    marginPct: Number(((profit / retailPrice) * 100).toFixed(1)),
    profit: Number(profit.toFixed(2)),
  };
}
