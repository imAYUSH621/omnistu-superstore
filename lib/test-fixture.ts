/**
 * Dev/test fixture rows are never sellable. They are recognised by slug prefix:
 *   fxt-   automated test fixtures
 *   cjstg- supplier-staging rows loaded into a dev DB (price = supplier cost, stock = supplier
 *          warehouse total, image = placeholder art). They are not retail catalog entries.
 */
const PREFIXES = ['fxt-', 'cjstg-'] as const;

export function isTestFixtureSlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && PREFIXES.some((p) => slug.startsWith(p));
}

export const TEST_FIXTURE_MESSAGE = 'Test fixture: not for sale.';

/**
 * Public storefront queries leave fixture rows out in a production runtime, so test rows in a
 * shared dev database are never listed or opened by customers. SHOW_TEST_FIXTURES=true shows them
 * (they stay badged and cannot be bought either way).
 */
export function hideFixturesInPublic(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === 'production' && env.SHOW_TEST_FIXTURES !== 'true';
}

export function fixtureExclusion(env: Record<string, string | undefined> = process.env) {
  return hideFixturesInPublic(env)
    ? { AND: PREFIXES.map((p) => ({ NOT: { slug: { startsWith: p } } })) }
    : {};
}
