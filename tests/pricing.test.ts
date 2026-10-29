import { calculateTieredPrice } from '../lib/utils';

describe('Smart Tiered Pricing Engine', () => {
  test('wholesale <= $2.00 gets 4.5x multiplier and healthy >75% margin', () => {
    const result = calculateTieredPrice(1.0);
    expect(result.retailPrice).toBe(5.95); // minimum floor
    expect(result.msrp).toBeGreaterThan(result.retailPrice);
    expect(result.marginPercent).toBeGreaterThanOrEqual(75);
  });

  test('wholesale $2.00 gets 4.5x multiplier', () => {
    const result = calculateTieredPrice(2.0);
    // 2.0 * 4.5 = 9.0 -> 9.95
    expect(result.retailPrice).toBe(9.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(75);
  });

  test('wholesale $3.00 gets 3.5x multiplier', () => {
    const result = calculateTieredPrice(3.0);
    // 3.0 * 3.5 = 10.5 -> 10.95
    expect(result.retailPrice).toBe(10.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(70);
  });

  test('wholesale $10.00 gets 2.8x multiplier', () => {
    const result = calculateTieredPrice(10.0);
    // 10.0 * 2.8 = 28.0 -> 28.95
    expect(result.retailPrice).toBe(28.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(60);
  });

  test('wholesale $25.00 gets 2.2x multiplier', () => {
    const result = calculateTieredPrice(25.0);
    // 25.0 * 2.2 = 55.0 -> 55.95
    expect(result.retailPrice).toBe(55.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(50);
  });

  test('wholesale $50.00 gets 1.8x multiplier', () => {
    const result = calculateTieredPrice(50.0);
    // 50.0 * 1.8 = 90.0 -> 90.95
    expect(result.retailPrice).toBe(90.95);
    expect(result.marginPercent).toBeGreaterThanOrEqual(40);
  });

  test('handles zero or invalid input defensively without throwing', () => {
    const result = calculateTieredPrice(0);
    expect(result.retailPrice).toBeGreaterThan(0);
    expect(result.marginPercent).toBeGreaterThan(0);
  });
});
