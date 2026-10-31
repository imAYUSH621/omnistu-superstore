import { convertPrice, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, DICTIONARY, fetchLiveExchangeRates } from '../lib/i18n';

describe('Global Multi-Currency & i18n Engine', () => {
  it('supports major world currencies with correct rates and symbols', () => {
    expect(SUPPORTED_CURRENCIES.USD).toBeDefined();
    expect(SUPPORTED_CURRENCIES.USD.symbol).toBe('$');

    expect(SUPPORTED_CURRENCIES.INR).toBeDefined();
    expect(SUPPORTED_CURRENCIES.INR.symbol).toBe('₹');
    expect(SUPPORTED_CURRENCIES.INR.rate).toBeGreaterThanOrEqual(80);

    expect(SUPPORTED_CURRENCIES.EUR).toBeDefined();
    expect(SUPPORTED_CURRENCIES.EUR.symbol).toBe('€');

    expect(SUPPORTED_CURRENCIES.GBP).toBeDefined();
    expect(SUPPORTED_CURRENCIES.GBP.symbol).toBe('£');
  });

  it('converts USD to INR accurately with Indian numbering format', () => {
    const res = convertPrice(100, 'INR');
    expect(res.amount).toBe(8650);
    expect(res.formatted).toBe('₹8,650');
  });

  it('converts USD to EUR accurately with European comma decimal formatting', () => {
    const res = convertPrice(100, 'EUR');
    expect(res.amount).toBe(92);
    expect(res.formatted).toBe('92,00 €');
  });

  it('converts USD to GBP accurately', () => {
    const res = convertPrice(100, 'GBP');
    expect(res.amount).toBe(79);
    expect(res.formatted).toBe('£79.00');
  });

  it('falls back safely to USD on unknown currency', () => {
    const res = convertPrice(50, 'XYZ_NONEXISTENT');
    expect(res.amount).toBe(50);
    expect(res.formatted).toBe('$50.00');
  });

  it('handles zero and negative amounts defensively', () => {
    const zeroRes = convertPrice(0, 'USD');
    expect(zeroRes.amount).toBe(0);
    expect(zeroRes.formatted).toBe('$0.00');

    const negRes = convertPrice(-25, 'INR');
    expect(negRes.amount).toBe(0);
  });

  it('contains comprehensive localization dictionaries across 6 languages', () => {
    const langs = ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'] as const;
    langs.forEach((lang) => {
      const dict = DICTIONARY[lang];
      expect(dict).toBeDefined();
      expect(dict.todaysDeals).toBeDefined();
      expect(dict.gourmetFood).toBeDefined();
      expect(dict.cart).toBeDefined();
    });

    // Check Hindi specific phrases
    expect(DICTIONARY.HI.gourmetFood).toBe('शाही भारतीय खाद्य');
    expect(DICTIONARY.HI.cart).toBe('कार्ट');
  });

  it('dynamically adapts to updated live exchange rates without hardcoded values', async () => {
    process.env.EXCHANGE_RATES_JSON = JSON.stringify({ EUR: 0.95, INR: 90.0 });
    const live = await fetchLiveExchangeRates();
    expect(live.rates.INR).toBe(90.0);
    expect(live.rates.EUR).toBe(0.95);
    const converted = convertPrice(100, 'INR');
    expect(converted.amount).toBe(9000);
    expect(converted.formatted).toBe('₹9,000');
    delete process.env.EXCHANGE_RATES_JSON;
  });
});
