/**
 * Catalog honesty: the bundled demo catalog (db/sample-data) must never be
 * served silently in the public production runtime. An empty sellable
 * catalog shows the honest empty state; /api/health catalogSource reports
 * what is actually served (database | demo-fallback | empty | unavailable),
 * not mere config presence.
 */
import { readFileSync } from 'fs';
import { sampleCatalogAllowed, hiddenSlugPrefixes } from '@/lib/test-fixture';

const actions = readFileSync('lib/actions/product.actions.ts', 'utf8');
const health = readFileSync('app/api/health/route.ts', 'utf8');

describe('sampleCatalogAllowed', () => {
  it('is false in the public production runtime (demo fallback suppressed)', () => {
    expect(sampleCatalogAllowed({ NODE_ENV: 'production' } as never)).toBe(false);
  });
  it('is false even with TEST_CHECKOUT_MODE on (test catalog comes from the DB, not demo data)', () => {
    expect(sampleCatalogAllowed({ NODE_ENV: 'production', TEST_CHECKOUT_MODE: 'true' } as never)).toBe(false);
  });
  it('is true outside production and when fixtures are explicitly shown', () => {
    expect(sampleCatalogAllowed({ NODE_ENV: 'development' } as never)).toBe(true);
    expect(sampleCatalogAllowed({ NODE_ENV: 'production', SHOW_TEST_FIXTURES: 'true' } as never)).toBe(true);
  });
  it('test-catalog rows stay hidden from the public storefront outside test mode', () => {
    expect(hiddenSlugPrefixes({ NODE_ENV: 'production' } as never)).toContain('cjt-');
    expect(hiddenSlugPrefixes({ NODE_ENV: 'production', TEST_CHECKOUT_MODE: 'true' } as never)).not.toContain('cjt-');
  });
});

describe('product action fallbacks are gated', () => {
  it('every sample-data fallback is behind sampleCatalogAllowed', () => {
    const guardCount = (actions.match(/if \(!sampleCatalogAllowed\(\)\)/g) || []).length;
    const fallbackCount = (actions.match(/sampleData\.products/g) || []).length;
    // 7 fallback sites (latest, bySlug, byId, all, categories, featured, facets); one import line
    expect(guardCount).toBe(7);
    expect(fallbackCount).toBeGreaterThanOrEqual(7);
  });
  it('empty public results are honest: no demo rows, no invented counts', () => {
    expect(actions).toContain('return { data: [], totalPages: 0, totalCount: 0 };');
  });
});

describe('health endpoint reports what is actually served', () => {
  it('probes visible (non-fixture) rows with a boolean EXISTS, never a count', () => {
    expect(health).toContain('SELECT EXISTS(SELECT 1 FROM "Product"');
    expect(health).toContain('hiddenSlugPrefixes');
    expect(health).not.toMatch(/count\(\*\)/i);
  });
  it('distinguishes database, demo-fallback, empty and unavailable', () => {
    for (const state of ["'database'", "'demo-fallback'", "'empty'", "'unavailable'"]) {
      expect(health).toContain(state);
    }
  });
  it('no longer reports config presence as the catalog source', () => {
    expect(health).not.toContain('catalogSource: catalogSource()');
  });
});
