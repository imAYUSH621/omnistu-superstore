import { planCatalogImport, seedAllowed } from '@/lib/catalog-import';

const row = (o: Record<string, unknown> = {}) => ({
  name: 'Test Product', slug: 'test-product', category: 'Home & Kitchen', brand: 'Omnistu',
  description: 'A test product', stock: 5, price: '9.99', images: ['/x.png'], ...o,
});

describe('planCatalogImport', () => {
  it('creates new slugs, skips existing ones by default', () => {
    const p = planCatalogImport([row(), row({ slug: 'other-one' })], new Set(['other-one']), false);
    expect(p.create.map((r) => r.slug)).toEqual(['test-product']);
    expect(p.skipExisting).toEqual(['other-one']);
    expect(p.update).toHaveLength(0);
  });
  it('update-existing plans an update for existing slugs only', () => {
    const p = planCatalogImport([row()], new Set(['test-product']), true);
    expect(p.update).toHaveLength(1);
    expect(p.create).toHaveLength(0);
  });
  it('rejects negative or fractional stock, bad price, missing images, duplicate slugs', () => {
    const p = planCatalogImport(
      [row({ stock: -1 }), row({ slug: 'a-b-c', stock: 1.5 }), row({ slug: 'p-p-p', price: 'free' }), row({ slug: 'i-i-i', images: [] }), row(), row()],
      new Set(),
      false
    );
    expect(p.invalid.map((i) => i.index)).toEqual([0, 1, 2, 3, 5]);
    expect(p.create).toHaveLength(1);
  });
  it('does not invent stock or brand: a row missing them is invalid', () => {
    const { stock: _s, brand: _b, ...rest } = row();
    void _s; void _b;
    expect(planCatalogImport([rest], new Set(), false).invalid).toHaveLength(1);
  });
  it('accepts a numeric price', () => {
    expect(planCatalogImport([row({ price: 12 })], new Set(), false).create).toHaveLength(1);
  });
});

describe('seedAllowed (the seed script deletes data)', () => {
  it('allows only local databases', () => {
    expect(seedAllowed('postgresql://u:p@localhost:5432/x', {}).ok).toBe(true);
    expect(seedAllowed('postgresql://u:p@127.0.0.1/x', {}).ok).toBe(true);
    expect(seedAllowed('postgresql://u:p@db.example.supabase.co:5432/x', {}).ok).toBe(false);
    expect(seedAllowed('postgresql://u:p@localhost/x', { NODE_ENV: 'production' }).ok).toBe(false);
    expect(seedAllowed(undefined, {}).ok).toBe(false);
    expect(seedAllowed('not a url', {}).ok).toBe(false);
  });
  it('explicit override is the only way past', () => {
    expect(seedAllowed('postgresql://u:p@remote.example/x', { ALLOW_DESTRUCTIVE_SEED: '1' }).ok).toBe(true);
  });
});
