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
