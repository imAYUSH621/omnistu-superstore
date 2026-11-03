import { describe, expect, test } from '@jest/globals';
import { queryMatchesName } from '../lib/search-match';

describe('word-start catalog matching (deterministic, provider-neutral)', () => {
  test('a query for "men" does not match "women" products', () => {
    expect(queryMatchesName("Women's Bangle Bracelet", 'men')).toBe(false);
    expect(queryMatchesName('Men Stainless Steel Ring', 'men')).toBe(true);
  });

  test('word-start prefix still finds inflections', () => {
    expect(queryMatchesName('CW15 Fast Wireless Charging Pad', 'charg')).toBe(true);
    expect(queryMatchesName('Wireless Chargers 2-Pack', 'charger')).toBe(true);
    expect(queryMatchesName('Supercharger Cable', 'charger')).toBe(false);
  });

  test('phrases match at a word start, case-insensitively', () => {
    expect(queryMatchesName('Fast Wireless Charging Pad', 'wireless charg')).toBe(true);
    expect(queryMatchesName('Fast Wireless Charging Pad', 'less charging')).toBe(false);
    expect(queryMatchesName('LED Wall Sconce', 'led wall')).toBe(true);
  });

  test('empty and "all" queries match everything', () => {
    expect(queryMatchesName('Anything', '')).toBe(true);
    expect(queryMatchesName('Anything', 'all')).toBe(true);
    expect(queryMatchesName('Anything', '   ')).toBe(true);
  });

  test('regex metacharacters in the query are literal', () => {
    expect(queryMatchesName('Toy (4-Pack)', '(4-pack')).toBe(true);
    expect(queryMatchesName('Price $10 item', '$10')).toBe(true);
    expect(queryMatchesName('abc', 'a.c')).toBe(false);
  });

  test('same input always gives the same answer', () => {
    const n = 'Magnetic Rechargeable Wall Sconce';
    expect(queryMatchesName(n, 'sconce')).toBe(queryMatchesName(n, 'sconce'));
    expect(queryMatchesName(n, 'sconce')).toBe(true);
    expect(queryMatchesName(n, 'once')).toBe(false);
  });
});
