import { calculateTieredPrice } from '../lib/utils';
import { priceFor, pricingConfigFromEnv } from '../lib/pricing';

describe('Smart Tiered Pricing Engine', () => {
  test('wholesale <= $2.00 gets 4.5x multiplier and healthy >75% margin', () => {
    const result = calculateTieredPrice(1.0);
    expect(result.retailPrice).toBe(5.95);
    expect(result.msrp).toBeGreaterThan(result.retailPrice);
    expect(result.marginPercent).toBeGreaterThanOrEqual(75);
  });

  test('wholesale $2.00 gets 4.5x multiplier', () => {
    const result = calculateTieredPrice(2.0);
    expect(result.retailPrice).toBe(9.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(75);
  });

  test('wholesale $3.00 gets 3.5x multiplier', () => {
    const result = calculateTieredPrice(3.0);
    expect(result.retailPrice).toBe(10.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(70);
  });

  test('wholesale $10.00 gets 2.8x multiplier', () => {
    const result = calculateTieredPrice(10.0);
    expect(result.retailPrice).toBe(28.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(60);
  });

  test('wholesale $25.00 gets 2.2x multiplier', () => {
    const result = calculateTieredPrice(25.0);
    expect(result.retailPrice).toBe(55.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(50);
  });

  test('wholesale $50.00 gets 1.8x multiplier', () => {
    const result = calculateTieredPrice(50.0);
    expect(result.retailPrice).toBe(90.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(40);
  });

  test('handles zero or invalid input defensively without throwing', () => {
    const result = calculateTieredPrice(0);
    expect(result.retailPrice).toBeGreaterThan(0);
    expect(result.marginPercent).toBeGreaterThan(0);
  });
});

describe('Omnistu Kit Mathematical Margin Engine (priceFor)', () => {
  test('guarantees target margin after product cost, shipping, and payment fees', () => {
    // $5.00 wholesale, $3.80 shipping, standard 2.9% + $0.30 fee and 30% margin
    const res = priceFor(5.0, 3.8);
    expect(res.retailPrice).toBeGreaterThan(13.0);
    expect(res.retailPrice % 1).toBeCloseTo(0.99, 2);
    expect(res.marginPct).toBeGreaterThanOrEqual(30);
    expect(res.profit).toBeGreaterThan(0);
  });

  test('handles zero cost and shipping safely without NaN or negative retail', () => {
    const res = priceFor(0, 0);
    expect(res.retailPrice).toBeGreaterThanOrEqual(0.99);
    expect(Number.isFinite(res.retailPrice)).toBe(true);
    expect(Number.isFinite(res.profit)).toBe(true);
  });

  test('handles negative or NaN input defensively', () => {
    const res = priceFor(-10, NaN);
    expect(res.retailPrice).toBeGreaterThanOrEqual(0.99);
    expect(Number.isFinite(res.retailPrice)).toBe(true);
  });

  test('throws error when feeRate + marginRate >= 100%', () => {
    expect(() => {
      priceFor(10, 5, { feePct: 50, feeFixed: 0.3, minMarginPct: 50 });
    }).toThrow('PAYMENT_FEE_PCT + MIN_MARGIN_PCT must be below 100');
  });

  test('pricingConfigFromEnv respects environment variables and fallbacks', () => {
    const custom = pricingConfigFromEnv({
      PAYMENT_FEE_PCT: '3.5',
      PAYMENT_FEE_FIXED: '0.40',
      MIN_MARGIN_PCT: '40',
    });
    expect(custom.feePct).toBe(3.5);
    expect(custom.feeFixed).toBe(0.4);
    expect(custom.minMarginPct).toBe(40);

    const fallback = pricingConfigFromEnv({});
    expect(fallback.feePct).toBe(2.9);
    expect(fallback.feeFixed).toBe(0.3);
    expect(fallback.minMarginPct).toBe(30);
  });
});
