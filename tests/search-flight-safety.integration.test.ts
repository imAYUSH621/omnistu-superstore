/**
 * REAL Postgres regression test for the /search Flight crash: raw groupBy
 * rows from getAllCategories carried the extended Prisma client's computed
 * price/rating getters; serializing them for a client component threw
 * "Cannot read properties of undefined (reading 'toString')" and the whole
 * search page failed with a server-side digest error.
 *
 * Requires DATABASE_URL pointing at disposable Postgres. Skipped otherwise.
 */
export {};
const RUN = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('127.0.0.1');

(RUN ? describe : describe.skip)('search flight safety (real DB)', () => {
  it('getAllCategories returns plain JSON-safe rows on the real database', async () => {
    const { getAllCategories } = await import('@/lib/actions/product.actions');
    const rows = await getAllCategories();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(() => JSON.stringify(row)).not.toThrow();
      expect(Object.keys(row).sort()).toEqual(['_count', 'category']);
      // no lazy computed-field getters survive on the returned row
      expect(Object.getOwnPropertyDescriptor(row, 'price')).toBeUndefined();
      expect(Object.getOwnPropertyDescriptor(row, 'rating')).toBeUndefined();
    }
  });

  it('select-subset product rows do not crash JSON.stringify', async () => {
    const { prisma } = await import('@/db/prisma');
    const rows = await prisma.product.findMany({ select: { name: true, slug: true }, take: 2 });
    expect(() => JSON.stringify(rows)).not.toThrow();
  });
});
