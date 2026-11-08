import { PrintifyAdapter } from '@/lib/suppliers/printify-adapter';
const a = new PrintifyAdapter('mock', 'mock');
const variant = { id: 1, price: 4500, is_enabled: true };

it.each([undefined, null, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, '2200'])('never substitutes retail for malformed production cost %s', cost => {
  const out = a.normalize({ id: 'p', title: 'Reference', variants: [{ ...variant, cost } as never] });
  expect(out).toMatchObject({ wholesaleCost: null, retailPrice: null, inStock: null, stockQuantity: null });
});
it.each([0, 2200])('preserves explicit single-variant integer production cents %s', cost => {
  const out = a.normalize({ id: 'p', title: 'Reference', variants: [{ ...variant, cost, is_available: true }] });
  expect(out?.wholesaleCost).toBe(cost / 100);
  expect(out?.retailPrice).toBeNull();
  expect(out?.inStock).toBeNull();
});
it('does not represent a cheapest retail variant as selected exact cost', () => {
  const out = a.normalize({ id: 'p', title: 'Reference', variants: [{ ...variant, cost: 2200 }, { ...variant, id: 2, price: 4200, cost: 2000 }] });
  expect(out?.wholesaleCost).toBeNull();
  expect(out?.retailPrice).toBeNull();
});
it('excludes disabled variants before evaluating a sole remaining reference cost', () => {
  const out = a.normalize({ id: 'p', title: 'Reference', variants: [{ ...variant, cost: 2200 }, { ...variant, id: 2, cost: 0, is_enabled: false }] });
  expect(out?.wholesaleCost).toBe(22);
});
