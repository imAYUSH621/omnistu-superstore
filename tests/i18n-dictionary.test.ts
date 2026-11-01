import { describe, expect, test } from '@jest/globals';
import { DICTIONARY, translate, type DictionaryKey } from '@/lib/i18n';

describe('i18n dictionary (G4)', () => {
  const enKeys = Object.keys(DICTIONARY.EN) as DictionaryKey[];
  const langs = Object.keys(DICTIONARY);

  test('every language covers every English key (no partial dictionaries)', () => {
    for (const lang of langs) {
      const dict = DICTIONARY[lang as keyof typeof DICTIONARY] as Record<string, string>;
      for (const key of enKeys) {
        expect(typeof dict[key]).toBe('string');
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });

  test('no unsupported shipping/guarantee claims are embedded in translations', () => {
    for (const lang of langs) {
      const dict = DICTIONARY[lang as keyof typeof DICTIONARY] as Record<string, string>;
      expect('freeShippingGuarantee' in dict).toBe(false);
    }
  });

  test('translate() falls back to English for unknown languages and never returns empty', () => {
    expect(translate('XX', 'todaysDeals')).toBe(DICTIONARY.EN.todaysDeals);
    expect(translate('HI', 'todaysDeals')).toBe(DICTIONARY.HI.todaysDeals);
    expect(translate('HI', 'todaysDeals')).not.toBe(DICTIONARY.EN.todaysDeals);
    for (const key of enKeys) {
      expect(translate('EN', key).length).toBeGreaterThan(0);
    }
  });
});
