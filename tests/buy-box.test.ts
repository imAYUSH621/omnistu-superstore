import { describe, expect, test } from '@jest/globals';

function calculateBuyBoxPricing(price: number, qty: number) {
  const priceNum = Math.max(0.01, Number(price) || 0.01);
  const safeQty = Math.max(1, Math.floor(qty) || 1);
  const msrpNum = Number((priceNum * 1.45).toFixed(2));
  const savingsPercent = Math.round(((msrpNum - priceNum) / msrpNum) * 100);
  const totalPrice = Number((priceNum * safeQty).toFixed(2));

  return {
    priceNum,
    msrpNum,
    savingsPercent,
    totalPrice,
  };
}

function getStockUrgencyStatus(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock > 10) return 'in_stock';
  if (stock > 0) return 'low_stock';
  return 'out_of_stock';
}

function formatAmazonOrderId(orderId: string): string {
  if (orderId.length > 15) {
    return `#114-${orderId.slice(0, 7)}-${orderId.slice(-7)}`;
  }
  return `#114-${orderId}`;
}

describe('Amazon Buy Box & Order Telemetry Engine', () => {
  test('calculates MSRP, savings percentage and total price correctly for single item', () => {
    const res = calculateBuyBoxPricing(12.99, 1);
    expect(res.priceNum).toBe(12.99);
    expect(res.msrpNum).toBe(18.84);
    expect(res.savingsPercent).toBe(31);
    expect(res.totalPrice).toBe(12.99);
  });

  test('calculates total price accurately across multiple quantities', () => {
    const res = calculateBuyBoxPricing(12.99, 4);
    expect(res.totalPrice).toBe(51.96);
  });

  test('handles fractional and zero quantities defensively', () => {
    const res = calculateBuyBoxPricing(20.0, 0);
    expect(res.totalPrice).toBe(20.0); // defaults to 1 item
  });

  test('correctly evaluates stock urgency thresholds', () => {
    expect(getStockUrgencyStatus(45)).toBe('in_stock');
    expect(getStockUrgencyStatus(10)).toBe('low_stock');
    expect(getStockUrgencyStatus(3)).toBe('low_stock');
    expect(getStockUrgencyStatus(0)).toBe('out_of_stock');
    expect(getStockUrgencyStatus(-1)).toBe('out_of_stock');
  });

  test('formats Amazon order telemetry IDs correctly from UUIDs', () => {
    const uuid = 'e50e095a-0f07-40c7-b01f-425553da53d8';
    const formatted = formatAmazonOrderId(uuid);
    expect(formatted).toBe('#114-e50e095-3da53d8');
    expect(formatted.startsWith('#114-')).toBe(true);
  });

  test('formats short order IDs safely', () => {
    const shortId = '98421094';
    expect(formatAmazonOrderId(shortId)).toBe('#114-98421094');
  });
});
