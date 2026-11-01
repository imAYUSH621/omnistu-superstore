/**
 * REAL Postgres catalog flow (category -> list/search/filter/sort/pagination -> product page lookup).
 * Seeds its own deterministic fixture products (slug prefix "fxt-<run>") and removes only those.
 * Never touches other rows. Requires REFUND_ITEST_DATABASE_URL (disposable DB) and the same URL as
 * DATABASE_URL. No supplier or provider calls; fixtures are test data, not catalog content.
 */
jest.mock('@/lib/utils', () => ({ ...jest.requireActual('@/lib/utils'), isDatabaseAvailable: () => true }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/auth', () => ({ auth: jest.fn() }));

import { prisma } from '@/db/prisma';
import { getAllProducts, getAllCategories, getProductBySlug, getFeaturedProducts, getFacetCounts } from '@/lib/actions/product.actions';

const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB && process.env.DATABASE_URL === DB ? describe : describe.skip;

maybe('catalog flow on REAL Postgres (fixtures)', () => {
  const run = Date.now().toString(36);
  const slug = (n: string) => `fxt-${run}-${n}`;
  const cats = ['FXT Tech', 'FXT Toys', 'FXT Home'];
  const rows = [
    { n: 'a', category: cats[0], price: '10.00', rating: '0', name: 'Fxt Widget Alpha' },
    { n: 'b', category: cats[0], price: '30.00', rating: '4.9', name: 'Fxt Widget Beta' },
    { n: 'c', category: cats[1], price: '5.00', rating: '0', name: 'Fxt Puzzle Gamma' },
    { n: 'd', category: cats[1], price: '24.99', rating: '0', name: 'Fxt Puzzle Delta' },
    { n: 'e', category: cats[2], price: '99.00', rating: '0', name: 'Fxt Lamp Epsilon' },
  ];
  const mine = (data: { slug: string }[]) => data.filter((p) => p.slug.startsWith(`fxt-${run}-`));

  beforeAll(async () => {
    for (const r of rows) {
      await prisma.product.create({
        data: { name: r.name, slug: slug(r.n), category: r.category, images: [], brand: 'Fxt', description: 'fixture', stock: 5, price: r.price, rating: r.rating },
      });
    }
  }, 30000);
  afterAll(async () => {
    await prisma.product.deleteMany({ where: { slug: { startsWith: `fxt-${run}-` } } });
    await prisma.$disconnect();
  }, 30000);

  const q = (o: Record<string, unknown>) => getAllProducts({ query: 'all', page: 1, limit: 50, ...o } as never);

  it('category filter returns exactly that category', async () => {
    const res = await q({ category: cats[1] });
    expect(res.data.map((p: { slug: string }) => p.slug).sort()).toEqual([slug('c'), slug('d')]);
  });
  it('price bucket 0-25 includes 5.00, 10.00, 24.99 and excludes 30 and 99', async () => {
    const res = mine((await q({ price: '0-25' })).data);
    expect(res.map((p) => p.slug).sort()).toEqual([slug('a'), slug('c'), slug('d')]);
  });
  it('search query matches name case-insensitively and combines with category', async () => {
    expect(mine((await q({ query: 'puzzle' })).data)).toHaveLength(2);
    expect(mine((await q({ query: 'widget', category: cats[1] })).data)).toHaveLength(0);
  });
  it('rating facet returns only matching products (zero-rated excluded)', async () => {
    const res = mine((await q({ rating: '4.8' })).data);
    expect(res.map((p) => p.slug)).toEqual([slug('b')]);
  });
  it('sort lowest and highest order by price', async () => {
    const lo = (await q({ category: cats[0], sort: 'lowest' })).data.map((p: { price: unknown }) => Number(p.price));
    expect(lo).toEqual([10, 30]);
    const hi = (await q({ category: cats[0], sort: 'highest' })).data.map((p: { price: unknown }) => Number(p.price));
    expect(hi).toEqual([30, 10]);
  });
  it('totalPages counts the FILTERED set', async () => {
    const res = await getAllProducts({ query: 'all', page: 1, limit: 1, category: cats[0] });
    expect(res.data).toHaveLength(1);
    expect(res.totalPages).toBe(2);
  });
  it('category aggregation lists fixture categories with their counts', async () => {
    const c = await getAllCategories();
    for (const [i, n] of [[0, 2], [1, 2], [2, 1]] as const) {
      expect(c.find((x) => x.category === cats[i])?._count).toBe(n);
    }
  });
  it('featured rail in database mode never returns bundled sample items', async () => {
    const res = await getFeaturedProducts();
    expect(res.every((p: { id: string }) => !p.id.startsWith('featured-'))).toBe(true);
    const dbFeatured = await prisma.product.count({ where: { isFeatured: true } });
    if (dbFeatured === 0) expect(res).toEqual([]);
  });
  it('Under $25 bucket includes sub-dollar items', async () => {
    const id = slug('z');
    await prisma.product.create({ data: { name: 'Fxt Tiny', slug: id, category: 'FXT Tiny', images: [], brand: 'Fxt', description: 'fixture', stock: 1, price: '0.24', rating: '0' } });
    const res = await q({ category: 'FXT Tiny', price: '0-25' });
    expect(res.data.map((p: { slug: string }) => p.slug)).toEqual([id]);
    expect((await getFacetCounts({ query: 'all', category: 'FXT Tiny' })).price['0-25']).toBe(1);
  });
  it('facet counts match what each option actually returns (and empty options show 0)', async () => {
    const f = await getFacetCounts({ query: 'all', category: cats[1] });
    expect(f.price['0-25']).toBe(2);
    expect(f.price['25-50']).toBe(0);
    expect(f.rating['4']).toBe(0);
    for (const b of ['0-25', '25-50', '50-100', '100-500']) {
      const r = await q({ category: cats[1], price: b });
      expect(r.data.length).toBe(f.price[b]);
    }
    const t = await getFacetCounts({ query: 'all', category: cats[0] });
    expect(t.rating['4']).toBe(1);
    expect((await q({ category: cats[0], rating: '4' })).data.length).toBe(1);
  });
  it('product page lookup by slug returns the product', async () => {
    const p = await getProductBySlug(slug('b'));
    expect(p?.name).toBe('Fxt Widget Beta');
  });

  it('variants: list shows option count and lowest reference cost; cascade delete leaves none', async () => {
    const p = await prisma.product.findFirstOrThrow({ where: { slug: slug('a') } });
    await prisma.productVariant.createMany({
      data: [
        { productId: p.id, sku: `FXT-${run}-1`, name: 'S', referenceCost: '12.60', supplierStock: 3 },
        { productId: p.id, sku: `FXT-${run}-2`, name: 'M', referenceCost: '9.50' },
      ],
    });
    const res = await q({ category: cats[0] });
    const a = mine(res.data as never).find((x: { slug: string }) => x.slug === slug('a')) as unknown as { variantCount: number; variantCostFrom: string; variants?: unknown };
    expect(a.variantCount).toBe(2);
    expect(a.variantCostFrom).toBe('9.50');
    expect(a.variants).toBeUndefined();
    const b = mine(res.data as never).find((x: { slug: string }) => x.slug === slug('b')) as unknown as { variantCount: number; variantCostFrom: string | null };
    expect(b.variantCount).toBe(0);
    expect(b.variantCostFrom).toBeNull();
    await prisma.product.delete({ where: { id: p.id } });
    expect(await prisma.productVariant.count({ where: { sku: { startsWith: `FXT-${run}-` } } })).toBe(0);
  });
});
