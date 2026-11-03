import { searchPage, searchLimit, searchPrice, searchRating, searchSort } from '../lib/search-input';
import { getAllProducts } from '../lib/actions/product.actions';
import { PAGE_SIZE } from '../lib/constants';
import { isDatabaseAvailable } from '../lib/utils';

describe('search numeric boundaries', () => {
  test.each([-1, 0, NaN, Infinity, 1.5, '1.5', '-2', 'NaN', 'Infinity', '1e2', '999999999999999999999', [], {}])('invalid page %p starts at first page', value => {
    expect(searchPage(value)).toBe(1);
  });
  test('valid integral pages and bounded limits preserve existing callers', () => {
    expect(searchPage('2')).toBe(2);
    expect(searchPage(500)).toBe(500);
    expect(searchLimit(200)).toBe(200);
    for (const value of [0, -1, 1.5, Infinity, NaN, 201]) expect(searchLimit(value)).toBe(24);
  });
  test.each(['NaN-25', '0-Infinity', '50-25', '-1-25', '0-25-30', '0-', '1e2-200', '0-100000001'])('invalid price %s is not sent to SQL', value => {
    expect(searchPrice(value)).toBe('all');
  });
  test('valid closed price intervals retain inclusive boundaries and decimals', () => {
    expect(searchPrice('25-50')).toBe('25-50');
    expect(searchPrice('10.25-20.75')).toBe('10.25-20.75');
    expect(searchPrice('0-0')).toBe('0-0');
  });
  test('ratings and sorts are bounded', () => {
    expect(searchRating('4.8')).toBe('4.8');
    for (const value of ['6', '-1', 'Infinity', 'NaN', '4x']) expect(searchRating(value)).toBe('all');
    expect(searchSort('lowest')).toBe('lowest');
    expect(searchSort('price; DROP')).toBe('newest');
  });
});

(isDatabaseAvailable() ? test.skip : test)('action normalizes invalid pagination before sample slicing too', async () => {
  const expected = await getAllProducts({ query: 'all', page: 1, limit: PAGE_SIZE });
  const invalid = await getAllProducts({ query: 'all', page: -1, limit: NaN, price: 'NaN-25', rating: 'Infinity' });
  expect(invalid.data.map(p => p.slug)).toEqual(expected.data.map(p => p.slug));
  expect(invalid.totalCount).toBe(expected.totalCount);
});
