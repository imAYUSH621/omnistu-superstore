import {
  getUnifiedCatalog,
  searchUnifiedCatalog,
  parseCatalogPrice,
  parseCatalogRating,
  parseCatalogReviews,
} from '@/lib/catalog-unified';
import { GET } from '@/app/api/jit-search/route';

describe('unified catalog loader (D15)', () => {
  it('loads the catalog once and caches it', () => {
    const a = getUnifiedCatalog();
    const b = getUnifiedCatalog();
    expect(a).toBe(b); // same array reference = no re-read/re-parse per call
    expect(a.length).toBeGreaterThan(0);
  });
  it('searches by title/category', () => {
    expect(searchUnifiedCatalog('saffron', '').length).toBeGreaterThan(0);
    expect(searchUnifiedCatalog('definitely-not-a-product-xyz', '').length).toBe(0);
  });
  it('parses honestly: no invented defaults', () => {
    expect(parseCatalogPrice('junk')).toBeNull();
    expect(parseCatalogPrice('$24.99')).toBe(24.99);
    expect(parseCatalogRating(undefined)).toBe(0);
    expect(parseCatalogRating('4.9 out of 5 stars')).toBe(4.9);
    expect(parseCatalogReviews(undefined)).toBe(0);
    expect(parseCatalogReviews('1,480')).toBe(1480);
  });
});

describe('jit-search route (D15)', () => {
  it('returns catalog products without fabricated review counts', async () => {
    const req = new Request('http://localhost/api/jit-search?q=saffron');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    for (const p of body.products) {
      expect(typeof p.rating).toBe('number');
      expect(typeof p.reviews_count).toBe('number');
      // ratings come from the source catalog or are 0 - never invented
      if (p.vendor !== 'OMNISTU_VERIFIED') {
        expect(p.rating).toBe(0);
        expect(p.reviews_count).toBe(0);
      }
      expect(p.shipping_estimate).toMatch(/estimate/i);
    }
  }, 15000);
});

describe('sample data catalog import (G1)', () => {
  it('storefront sample catalog now includes the verified supplier catalog', () => {
    const sd = require('@/db/sample-data').default;
    expect(sd.products.length).toBeGreaterThanOrEqual(30);
    const imported = sd.products.filter((p: any) => p.brand === 'Omnistu Verified');
    expect(imported.length).toBeGreaterThan(0);
    for (const p of imported) {
      expect(p.rating).toBe(0);
      expect(p.numReviews).toBe(0);
      expect(p.slug).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
    }
  });
});
