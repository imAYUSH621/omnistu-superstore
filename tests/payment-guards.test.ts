import { isAmountMismatch, sameLineItems } from '@/lib/payment-guards';

describe('isAmountMismatch (D12)', () => {
  it('accepts an exact capture', () => {
    expect(isAmountMismatch('42.00', 42)).toBe(false);
  });
  it('accepts a one-cent rounding difference', () => {
    expect(isAmountMismatch('42.01', 42)).toBe(false);
  });
  it('rejects an undercharge', () => {
    expect(isAmountMismatch('4.20', 42)).toBe(true);
  });
  it('rejects an overcharge', () => {
    expect(isAmountMismatch('420.00', 42)).toBe(true);
  });
  it('rejects a non-numeric capture', () => {
    expect(isAmountMismatch('abc', 42)).toBe(true);
  });
  it('passes through when nothing was captured yet', () => {
    expect(isAmountMismatch(undefined, 42)).toBe(false);
    expect(isAmountMismatch('', 42)).toBe(false);
  });
});

describe('sameLineItems (D11 fallback dedupe)', () => {
  const cart = [
    { productId: 'p1', qty: 2 },
    { productId: 'p2', qty: 1 },
  ];
  it('matches identical items in any order', () => {
    expect(sameLineItems(cart, [{ productId: 'p2', qty: 1 }, { productId: 'p1', qty: 2 }])).toBe(true);
  });
  it('rejects different quantities', () => {
    expect(sameLineItems(cart, [{ productId: 'p2', qty: 1 }, { productId: 'p1', qty: 3 }])).toBe(false);
  });
  it('rejects different products', () => {
    expect(sameLineItems(cart, [{ productId: 'p9', qty: 1 }, { productId: 'p1', qty: 2 }])).toBe(false);
  });
  it('rejects different lengths', () => {
    expect(sameLineItems(cart, [{ productId: 'p1', qty: 2 }])).toBe(false);
  });
});
