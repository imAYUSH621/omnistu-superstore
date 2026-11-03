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

export function hideFixturesInPublic(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === 'production' && env.SHOW_TEST_FIXTURES !== 'true';
}

// Slug prefixes hidden from the public storefront in this runtime. Shared by
// the Prisma filter (fixtureExclusion) and the raw-SQL search path, so both
// exclude exactly the same rows.
export function hiddenSlugPrefixes(env: Record<string, string | undefined> = process.env): string[] {
  const hidden: string[] = [];
  if (hideFixturesInPublic(env)) hidden.push(...PREFIXES);
  // Test-catalog rows (cjt-) exist for simulated checkout only: outside
  // TEST_CHECKOUT_MODE they are never listed, opened or searched, in any
  // runtime, so demo-markup prices and unverified supplier data can never
  // leak into a real catalog.
  if (env.TEST_CHECKOUT_MODE !== 'true') hidden.push(TEST_CATALOG_PREFIX);
  return hidden;
}

// The bundled demo catalog (db/sample-data) exists for local development and
// demos only. In the public production runtime an empty sellable catalog must
// stay honest: no silent demo-product fallback (a demo row shown as a real
// product is a false storefront). Same public-runtime rule as fixture hiding.
export function sampleCatalogAllowed(env: Record<string, string | undefined> = process.env): boolean {
  return !hideFixturesInPublic(env);
}

export function fixtureExclusion(env: Record<string, string | undefined> = process.env) {
  const hidden = hiddenSlugPrefixes(env);
  return hidden.length ? { AND: hidden.map((p) => ({ NOT: { slug: { startsWith: p } } })) } : {};
}

