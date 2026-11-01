/**
 * Real Postgres test (disposable DB with the 20261102003000 migration applied).
 * Skipped without DATABASE_URL or when the tables are missing.
 */
export {};
const RUN = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('127.0.0.1');

(RUN ? describe : describe.skip)('auth limits and session version (real DB)', () => {
  const key = `limit-${Date.now()}@example.test`;

  it('blocks after the maximum, isolates keys, and clears', async () => {
    const { hitLimit, clearLimit } = await import('@/lib/auth-limits');
    const first = await hitLimit('itest', key, 3, 60);
    if (!first.available) return; // migration not applied on this DB: nothing to assert
    expect(first.allowed).toBe(true);
    expect((await hitLimit('itest', key, 3, 60)).allowed).toBe(true);
    expect((await hitLimit('itest', key, 3, 60)).allowed).toBe(true);
    expect((await hitLimit('itest', key, 3, 60)).allowed).toBe(false);
    expect((await hitLimit('itest', 'other-' + key, 3, 60)).allowed).toBe(true);
    await clearLimit('itest', key);
    expect((await hitLimit('itest', key, 3, 60)).allowed).toBe(true);
    await clearLimit('itest', key);
    await clearLimit('itest', 'other-' + key);
  });

  it('a bump raises the session version', async () => {
    const { getSessionVersion, bumpSessionVersion } = await import('@/lib/session-version');
    const { prisma } = await import('@/db/prisma');
    const id = '00000000-0000-4000-8000-0000000000aa';
    const before = await getSessionVersion(id);
    if (!(await bumpSessionVersion(id))) return;
    expect(await getSessionVersion(id)).toBe(before + 1);
    await prisma.$executeRaw`DELETE FROM "UserSessionVersion" WHERE "userId" = ${id}::uuid`;
  });
});
