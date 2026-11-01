import fs from 'fs';
import path from 'path';
import { assessUnifiedCatalog, mapUnifiedToProductRow } from '@/lib/catalog-readiness';

describe('real catalog_unified.json import readiness', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/catalog_unified.json'), 'utf8'));
  const items = Object.values(raw) as never[];

  it('maps only what the file contains and invents nothing', () => {
    const row = mapUnifiedToProductRow({ asin: 'OMN-X-01', title: 'Thing', price: '$24.99', image: '/a', thumbnails: ['/a', '/b'], category: 'C' });
    expect(row).toEqual({ name: 'Thing', slug: 'omn-x-01', category: 'C', price: '24.99', images: ['/a', '/b'] });
    expect(row).not.toHaveProperty('brand');
    expect(row).not.toHaveProperty('stock');
  });
  it('today none of the real rows is importable: brand, description and stock are missing', () => {
    const r = assessUnifiedCatalog(items);
    expect(r.total).toBe(22);
    expect(r.importable).toBe(0);
    expect(r.invalid).toBe(22);
    expect(r.missing).toEqual(['brand', 'description', 'stock']);
  });
  it('becomes importable once a source supplies the missing fields (mapper is not the blocker)', () => {
    const { planCatalogImport } = jest.requireActual('@/lib/catalog-import');
    const filled = items.map((u) => ({ ...mapUnifiedToProductRow(u), brand: 'Omnistu', description: 'Described by owner', stock: 3 }));
    expect(planCatalogImport(filled, new Set(), false).create).toHaveLength(22);
  });
});
