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

// Test catalog rows (slug prefix cjt-): real supplier data imported for owner
// acceptance testing on a protected deployment. Unlike fixtures they can flow
// through a SIMULATED checkout, but only while TEST_CHECKOUT_MODE=true. They
// are never a retail offer: price is supplier cost plus a demo markup, and
// supplier images/claims stay unverified until qualification (see
// catalog-qualification.md in the backup File).
export const TEST_CATALOG_PREFIX = 'cjt-';

export function isTestCatalogSlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && slug.startsWith(TEST_CATALOG_PREFIX);
}

export const TEST_CATALOG_MESSAGE = 'Test catalog item: simulated checkout only (test mode is off).';
