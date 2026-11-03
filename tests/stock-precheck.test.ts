import { describe, expect, test } from '@jest/globals';
import { firstUnavailableLine } from '@/lib/payment-guards';

describe('firstUnavailableLine', () => {
  const stock = new Map([['a', 3], ['b', 0]]);
  test('null when every line fits', () => {
    expect(firstUnavailableLine([{ productId: 'a', qty: 3 }], stock)).toBeNull();
  });
  test('names the first line over stock', () => {
    expect(firstUnavailableLine([{ productId: 'a', qty: 1 }, { productId: 'a', qty: 4, name: 'Widget' }], stock)).toBe('Widget');
  });
  test('zero stock and missing product are unavailable', () => {
    expect(firstUnavailableLine([{ productId: 'b', qty: 1, name: 'B' }], stock)).toBe('B');
    expect(firstUnavailableLine([{ productId: 'gone', qty: 1 }], stock)).toBe('gone');
  });
});
