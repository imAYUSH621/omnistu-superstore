import { supplierStagingCandidate } from '../lib/suppliers/staging';
import { CjAdapter } from '../lib/suppliers/cj-adapter';

describe('supplier candidate qualification boundary', () => {
  const cj = new CjAdapter('not-used');
  test('missing cost and stock remain unknown through actual CJ normalization and staging', () => {
    const source = cj.normalize({pid: 'P1', productNameEn: 'Reference item'});
    const p = supplierStagingCandidate(source, 'item');
    expect(p).toMatchObject({wholesaleCost: null, stockQuantity: null, inStock: null, retailPrice: null, estimatedMarginPct: null, retailPriceInr: null, status: 'pending_review'});
  });
  test('known source cost does not create retail price or inventory', () => {
    const p = supplierStagingCandidate(cj.normalize({pid: 'P1', sellPrice: '2.5 -- 3.5'}), 'item');
    expect(p.wholesaleCost).toBe(3.5);
    expect(p.retailPrice).toBeNull();
    expect(p.inStock).toBeNull();
    expect(p.reviewChecklist).toContain('exact destination freight and method confirmed');
  });
  test('existing supplier retail and known stock do not authorize an Omnistu retail offer', () => {
    const source = {...cj.normalize({pid:'P1',sellPrice:2}), supplier:'PRINTIFY' as const, retailPrice:50, inStock:true, stockQuantity:3};
    const p = supplierStagingCandidate(source, 'shirt');
    expect(p.retailPrice).toBeNull();
    expect(p.inStock).toBe(true);
    expect(p.stockQuantity).toBe(3);
    expect(source.retailPrice).toBe(50);
  });
});
