import { describe, expect, test } from '@jest/globals';
import { ratesDisclosure } from '@/lib/rates-disclosure';

describe('ratesDisclosure honesty copy', () => {
  test('live_api and cache are labeled hourly live rates', () => {
    expect(ratesDisclosure('live_api').ratesClause).toContain('hourly live rates');
    expect(ratesDisclosure('cache').ratesClause).toContain('hourly live rates');
    expect(ratesDisclosure('live_api').live).toBe(true);
    expect(ratesDisclosure('cache').live).toBe(true);
  });

  test('default_safe and env_override are NOT labeled hourly', () => {
    for (const source of ['default_safe', 'env_override'] as const) {
      const d = ratesDisclosure(source);
      expect(d.live).toBe(false);
      expect(d.ratesClause).not.toContain('hourly');
      expect(d.ratesClause).toContain('reference rates');
      expect(d.ratesClause).toContain('temporarily unavailable');
      expect(d.priceTitle).toContain('live rates temporarily unavailable');
    }
  });

  test('unknown or missing source degrades to reference wording, never hourly', () => {
    for (const source of [null, undefined, '', 'something_else']) {
      const d = ratesDisclosure(source);
      expect(d.live).toBe(false);
      expect(d.ratesClause).not.toContain('hourly');
    }
  });

  test('every variant keeps the USD settlement disclosure', () => {
    for (const source of ['live_api', 'cache', 'default_safe', 'env_override', null]) {
      expect(ratesDisclosure(source).priceTitle).toContain('checkout charges USD');
    }
  });
});
