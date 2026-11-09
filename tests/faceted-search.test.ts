import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import sampleData from '../db/sample-data';
import { getAllProducts, getAllCategories } from '../lib/actions/product.actions';

const prismaClientSrc = readFileSync('db/prisma.ts', 'utf8');
const productActionsSrc = readFileSync('lib/actions/product.actions.ts', 'utf8');

import { isDatabaseAvailable } from '../lib/utils';
// Positive-presence checks need a known catalog. They run against the bundled sample
// data only; with a real DB the same behaviour is proven against seeded fixtures in
// tests/catalog-flow.integration.test.ts (invariants below still run on any source).
const sampleOnly = isDatabaseAvailable() ? test.skip : test;

describe('Amazon-Style Faceted Search Engine Invariants', () => {
  test('Zero Amazon CDN hotlinks in product database', () => {
    sampleData.products.forEach((product) => {
      product.images.forEach((img) => {
        expect(img).not.toContain('media-amazon.com');
        expect(img).not.toContain('images-na.ssl-images-amazon.com');
        expect(img.startsWith('/')).toBe(true);
      });
    });
  });

  sampleOnly('Faceted Filter: Category filtering isolates Toys & Games', async () => {
    const res = await getAllProducts({
      query: 'all',
      category: 'Toys & Games',
      page: 1,
      limit: 50,
    });
    expect(res.data.length).toBeGreaterThan(0);
    res.data.forEach((p) => {
      expect(p.category).toBe('Toys & Games');
    });
  });

  sampleOnly('Faceted Filter: Price bucket Under $25 (1-25)', async () => {
    const res = await getAllProducts({
      query: 'all',
      price: '1-25',
      page: 1,
      limit: 50,
    });
    expect(res.data.length).toBeGreaterThan(0);
    res.data.forEach((p) => {
      const priceNum = Number(p.price);
      expect(priceNum).toBeGreaterThanOrEqual(1);
      expect(priceNum).toBeLessThanOrEqual(25);
    });
  });

  test('Faceted Filter: Rating 4.8 & up filter', async () => {
    const res = await getAllProducts({
      query: 'all',
      rating: '4.8',
      page: 1,
      limit: 50,
    });
    // Invariant: every returned product must actually match the rating facet.
    res.data.forEach((p) => {
      expect(Number(p.rating)).toBeGreaterThanOrEqual(4.8);
    });
    // The catalog has honest zero ratings until real customer reviews exist,
    // so the facet must return an empty result instead of unfiltered products.
    if (sampleData.products.every((p) => Number(p.rating) === 0)) {
      expect(res.data.length).toBe(0);
    }
  });

  test('Sorting: Lowest Price (asc) sorts correctly', async () => {
    const res = await getAllProducts({
      query: 'all',
      sort: 'lowest',
      page: 1,
      limit: 50,
    });
    for (let i = 0; i < res.data.length - 1; i++) {
      expect(Number(res.data[i].price)).toBeLessThanOrEqual(Number(res.data[i + 1].price));
    }
  });

  test('Sorting: Highest Price (desc) sorts correctly', async () => {
    const res = await getAllProducts({
      query: 'all',
      sort: 'highest',
      page: 1,
      limit: 50,
    });
    for (let i = 0; i < res.data.length - 1; i++) {
      expect(Number(res.data[i].price)).toBeGreaterThanOrEqual(Number(res.data[i + 1].price));
    }
  });

  sampleOnly('Categories aggregation returns non-zero counts', async () => {
    const categories = await getAllCategories();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    categories.forEach((cat) => {
      expect(cat._count).toBeGreaterThan(0);
    });
  });
});


describe('Search page Flight-safety regressions (real crash: digest on /search)', () => {
  test('prisma computed fields declare needs guards so subset rows never crash', () => {
    // Without needs, the client attaches lazy price/rating getters to rows
    // that lack those fields (groupBy/select subsets); Flight serialization
    // then invokes them and crashes the whole page render.
    const productBlock = prismaClientSrc.slice(prismaClientSrc.indexOf('product: {'), prismaClientSrc.indexOf('cart: {'));
    expect(productBlock).toContain('needs: { price: true }');
    expect(productBlock).toContain('needs: { rating: true }');
    const orderItemBlock = prismaClientSrc.slice(prismaClientSrc.indexOf('orderItem: {'));
    expect(orderItemBlock).toContain('needs: { price: true }');
  });

  test('getAllCategories maps groupBy rows to plain objects before returning', () => {
    expect(productActionsSrc).toContain('data.map((d) => ({ category: d.category, _count: d._count }))');
  });

  test('getAllCategories result is JSON-serializable with only category/_count keys', async () => {
    const rows = await getAllCategories();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(() => JSON.stringify(row)).not.toThrow();
      expect(Object.keys(row).sort()).toEqual(['_count', 'category']);
    }
  });
});


describe('Search discovery honesty (labels and quick-search terms)', () => {
  const chipsSrc = readFileSync('components/shared/search/search-narrow-chips.tsx', 'utf8');
  const sidebarSrc = readFileSync('components/shared/search/search-faceted-sidebar.tsx', 'utf8');

  test('narrow chips take category names from the live category list, never hard-coded', () => {
    expect(chipsSrc).toContain('label: homeDepartment(c.category,language)');
    for (const hardcoded of ['Electronics & Gadgets', 'Apparel & Merch', 'Home & Kitchen', 'Toys & Games', 'Sensory & Toys']) {
      expect(chipsSrc).not.toContain(hardcoded);
    }
  });

  test('every popular-ideas term matches at least one catalog product name', () => {
    const m = sidebarSrc.match(/\{\[([^\]]+)\]\.map/);
    expect(m).toBeTruthy();
    const ideas = (m![1].match(/'[^']+'/g) || []).map((t) => t.slice(1, -1));
    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      const needle = idea.toLowerCase();
      const hit = sampleData.products.some((p) => p.name.toLowerCase().includes(needle));
      expect(hit).toBe(true);
    }
  });
});
