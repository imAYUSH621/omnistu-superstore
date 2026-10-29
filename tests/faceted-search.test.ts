import { describe, expect, test } from 'bun:test';
import sampleData from '../db/sample-data';
import { getAllProducts, getAllCategories } from '../lib/actions/product.actions';

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

  test('Faceted Filter: Category filtering isolates Toys & Games', async () => {
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

  test('Faceted Filter: Price bucket Under $25 (1-25)', async () => {
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
    expect(res.data.length).toBeGreaterThan(0);
    res.data.forEach((p) => {
      expect(Number(p.rating)).toBeGreaterThanOrEqual(4.8);
    });
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

  test('Categories aggregation returns non-zero counts', async () => {
    const categories = await getAllCategories();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    categories.forEach((cat) => {
      expect(cat._count).toBeGreaterThan(0);
    });
  });
});
