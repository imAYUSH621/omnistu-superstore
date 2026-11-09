/**
 * DB-level word-start search against a real database. Runs only when
 * DATABASE_URL is set (env-gated like the other integration suites).
 * Hermetic: the suite inserts its own fxt- fixture rows in beforeAll and
 * deletes them in afterAll, so it does not depend on any pre-existing
 * catalog content (standalone "Men" products) on the target database.
 * Uses only this explicitly opted-in disposable local database.
 */
import { beforeAll, afterAll, describe, expect, test } from '@jest/globals';
jest.mock('../lib/utils',()=>({...jest.requireActual('../lib/utils'),isDatabaseAvailable:()=>localDatabaseTestEnabled()}));
import {localDatabaseTestEnabled} from './helpers/local-database';
import { getAllProducts, getFacetCounts } from '../lib/actions/product.actions';
import { prisma } from '../db/prisma';

const db = localDatabaseTestEnabled() ? test : test.skip;

jest.setTimeout(30000); // bounded local database integration

// fxt- rows are test fixtures (lib/test-fixture): visible to queries in a
// test runtime, excluded from any production storefront by slug prefix.
const FIXTURES = [
  {
    name: "Fixture Men's Trail Watch",
    slug: 'fxt-men-trail-watch',
    category: 'Fixture',
    images: [] as string[],
    description: 'word-start fixture',
    stock: 1,
    price: 1,
  },
  {
    name: "Fixture Women's Shawl",
    slug: 'fxt-women-shawl',
    category: 'Fixture',
    images: [] as string[],
    description: 'word-start fixture',
    stock: 1,
    price: 1,
  },
];

beforeAll(async () => {
  if (!localDatabaseTestEnabled()) return;
  for (const p of FIXTURES) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
});

afterAll(async () => {
  if (!localDatabaseTestEnabled()) return;
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'fxt-' } } });
  await prisma.$disconnect();
});

describe('SQL word-start search (env-gated, hermetic fixtures)', () => {
  db('q=men matches only names with standalone Men at a word start', async () => {
    const res = await getAllProducts({ query: 'men', category: 'all', price: 'all', rating: 'all', sort: 'newest', page: 1, limit: 50 });
    expect(res.data.length).toBeGreaterThan(0);
    for (const p of res.data) {
      expect(/(^|[^a-z0-9])men/i.test(p.name)).toBe(true);
      expect(/(^|[^a-z0-9])women'?s?(?![a-z])/i.test(p.name) && !/(^|[^a-z0-9])men/i.test(p.name)).toBe(false);
    }
    expect(res.totalCount).toBe(res.data.length <= 50 ? res.data.length : res.totalCount);
  });

  db('facet counts agree with filtered results', async () => {
    const res = await getAllProducts({ query: 'men', category: 'all', price: 'all', rating: 'all', sort: 'newest', page: 1, limit: 50 });
    const facets = await getFacetCounts({ query: 'men', category: 'all' });
    const bucketTotal = Object.values(facets.price).reduce((a, b) => a + b, 0);
    expect(bucketTotal).toBeGreaterThanOrEqual(res.totalCount); // buckets can overlap at boundaries? no - exclusive ranges
    expect(bucketTotal).toBe(res.totalCount);
  });

  db('pagination counts come from SQL and pages stay consistent', async () => {
    const p1 = await getAllProducts({ query: 'all', category: 'all', price: 'all', rating: 'all', sort: 'newest', page: 1, limit: 5 });
    const p2 = await getAllProducts({ query: 'all', category: 'all', price: 'all', rating: 'all', sort: 'newest', page: 2, limit: 5 });
    expect(p1.totalCount).toBe(p2.totalCount);
    expect(p1.totalPages).toBe(Math.ceil(p1.totalCount / 5));
    const ids1 = new Set(p1.data.map((p) => p.id));
    expect(p2.data.every((p) => !ids1.has(p.id))).toBe(true);
  });
});
