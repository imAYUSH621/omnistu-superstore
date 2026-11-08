import { parseReferenceCost } from '@/lib/suppliers/reference-cost';
import { BlankaAdapter } from '@/lib/suppliers/blanka-adapter';
import { TrendsiAdapter } from '@/lib/suppliers/trendsi-adapter';
import { BrandsGatewayAdapter } from '@/lib/suppliers/brandsgateway-adapter';

const adapters = [new BlankaAdapter('mock'), new TrendsiAdapter('mock'), new BrandsGatewayAdapter('mock')];
const invalid = [undefined, null, '', ' ', -1, '-2.20', NaN, Infinity, Number.MAX_VALUE, 'USD4plus10', '$4.20', '1-3', '1e3', '5.2junk', {}, true];

describe('non-CJ reference normalization', () => {
  it.each(invalid)('keeps malformed or missing cost unknown: %s', value => {
    expect(parseReferenceCost(value)).toBeNull();
    for (const a of adapters) {
      const out = a.normalize({ id: 'ref', wholesale_price: value } as never);
      expect(out.wholesaleCost).toBeNull();
      expect(out.retailPrice).toBeNull();
      expect(out.compareAtPrice).toBeNull();
      expect(out.inStock).toBeNull();
      expect(out.stockQuantity).toBeNull();
    }
  });
  it.each([0, '0', 6.5, ' 6.50 '])('preserves explicit reference cost without inferring availability: %s', value => {
    for (const a of adapters) {
      const out = a.normalize({ id: 'ref', wholesale_price: value, retail_price: 795 } as never);
      expect(out.wholesaleCost).toBe(Number(value));
      expect(out.retailPrice).toBeNull();
      expect(out.compareAtPrice).toBeNull();
      expect(out.inStock).toBeNull();
      expect(out.shippingNote).not.toMatch(/branded|certificate|\d+-\d+ business|US warehouse/i);
    }
  });
  it('never treats the old constructor freight allowance as a live quote', () => {
    for (const a of [new BlankaAdapter('mock', 0), new TrendsiAdapter('mock', 999), new BrandsGatewayAdapter('mock', -1)]) {
      expect(a.normalize({ id: 'ref', wholesale_price: 10 }).retailPrice).toBeNull();
    }
  });
  it('keeps Trendsi source price fallback strict and never substitutes a malformed wholesale value', () => {
    const a = new TrendsiAdapter('mock');
    expect(a.normalize({ id: 'ref', price: '12.50' }).wholesaleCost).toBe(12.5);
    expect(a.normalize({ id: 'ref', wholesale_price: 'bad', price: 20 }).wholesaleCost).toBeNull();
  });
});
