import { isAmountMismatch, sameLineItems } from '@/lib/payment-guards';

describe('isAmountMismatch (D12)', () => {
  it('accepts an exact capture', () => {
    expect(isAmountMismatch('42.00', 42)).toBe(false);
  });
  it('rejects a one-cent difference in either direction (exact minor units, no tolerance)', () => {
    expect(isAmountMismatch('42.01', 42)).toBe(true);
    expect(isAmountMismatch('41.99', 42)).toBe(true);
  });
  it('compares Decimal(12,2) string totals exactly', () => {
    expect(isAmountMismatch('42.50', '42.5')).toBe(false);
    expect(isAmountMismatch('42.5', '42.50')).toBe(false);
    expect(isAmountMismatch('0.30', 0.1 + 0.2)).toBe(false); // float noise in the expected side does not matter
  });
  it('treats unparseable or over-precise amounts as mismatches', () => {
    expect(isAmountMismatch('42.505', '42.50')).toBe(true);
    expect(isAmountMismatch('1e2', '100.00')).toBe(true);
    expect(isAmountMismatch('NaN', '42.50')).toBe(true);
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
