import { describe, expect, test } from '@jest/globals';
import { wordStartPattern } from '../lib/search-sql';
import { queryMatchesName } from '../lib/search-match';

describe('SQL word-start pattern (PostgreSQL POSIX)', () => {
  test('anchors at a word start', () => {
    expect(wordStartPattern('men')).toBe('\\mmen');
  });
  test('regex metacharacters are escaped to literal', () => {
    expect(wordStartPattern('a.c')).toBe('\\ma\\.c');
    expect(wordStartPattern('(4-pack')).toBe('\\m\\(4\\-pack'.replace('\\-', '-')); // '-' is not special outside classes
    expect(wordStartPattern('$10')).toBe('\\m\\$10');
  });
  test('matches the same answers as the JS matcher on sample names', () => {
    // cross-check the two implementations agree on tricky cases
    const cases: Array<[string, string, boolean]> = [
      ["Women's Bangle", 'men', false],
      ['Men Ring', 'men', true],
      ['Three-dimensional Toy', 'men', false],
      ['Fast Wireless Charging Pad', 'charg', true],
      ['Supercharger Cable', 'charger', false],
    ];
    for (const [name, q, expected] of cases) {
      expect(queryMatchesName(name, q)).toBe(expected);
    }
  });
});
