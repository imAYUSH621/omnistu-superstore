import { withVariantSummary } from '@/lib/product-variants';

describe('withVariantSummary', () => {
  it('counts options and takes the lowest reference cost, never a price', () => {
    const r = withVariantSummary({ id: 'a', variants: [{ referenceCost: '12.60' }, { referenceCost: '9.5' }, { referenceCost: null }] } as { id: string; variants: { referenceCost: unknown }[] });
    expect(r.variantCount).toBe(3);
    expect(r.variantCostFrom).toBe('9.50');
    expect('variants' in r).toBe(false);
  });
  it('no variants -> zero count and no cost', () => {
    const noVariants: { id: string; variants?: { referenceCost: unknown }[] } = { id: 'a' };
    const r = withVariantSummary(noVariants);
    expect(r.variantCount).toBe(0);
    expect(r.variantCostFrom).toBeNull();
  });
});
