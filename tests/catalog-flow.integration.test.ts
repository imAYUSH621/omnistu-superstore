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
import { getAllProducts, getAllCategories, getProductBySlug } from '@/lib/actions/product.actions';

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
  it('price bucket 1-25 includes 5.00, 10.00, 24.99 and excludes 30 and 99', async () => {
    const res = mine((await q({ price: '1-25' })).data);
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
  it('product page lookup by slug returns the product', async () => {
    const p = await getProductBySlug(slug('b'));
    expect(p?.name).toBe('Fxt Widget Beta');
  });
});
