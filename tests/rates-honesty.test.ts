import fs from 'fs';

describe('exchange rate labelling', () => {
  it('a cached fallback keeps reporting default_safe', async () => {
    jest.resetModules();
    const realFetch = global.fetch;
    global.fetch = jest.fn(async () => { throw new Error('offline'); }) as never;
    const prev = process.env.EXCHANGE_RATES_JSON;
    delete process.env.EXCHANGE_RATES_JSON;
    const { fetchLiveExchangeRates } = await import('@/lib/exchange-rates');
    const a = await fetchLiveExchangeRates();
    const b = await fetchLiveExchangeRates();
    expect(a.source).toBe('default_safe');
    expect(b.source).toBe('default_safe');
    global.fetch = realFetch;
    if (prev !== undefined) process.env.EXCHANGE_RATES_JSON = prev;
  });
  it('customer copy does not promise real-time or verified institutional rates (source check)', () => {
    for (const f of ['components/shared/header/global-selector.tsx', 'app/(root)/currency/page.tsx', 'app/(root)/about/page.tsx']) {
      expect(fs.readFileSync(f, 'utf8')).not.toMatch(/real-time|institutional/i);
    }
  });
  it('returns page does not promise live carrier status (source check)', () => {
    expect(fs.readFileSync('app/(root)/returns/page.tsx', 'utf8')).not.toMatch(/live real-time carrier/i);
  });
  it('selector currency UI is wired to real display conversion with honest USD-settlement disclosure', () => {
    // Currency selection was re-added together with actual display
    // conversion (LocalizedPrice on browsing surfaces). The guard now
    // asserts the wiring exists AND the disclosure is honest: approximate
    // reference conversion, source-aware rates wording, checkout charges
    // USD. The rates clause comes from lib/rates-disclosure.ts so the UI
    // can never claim "hourly" while the feed is in fallback; the exact
    // wording contract is locked by tests/rates-disclosure.test.ts.
    const src = fs.readFileSync('components/shared/header/global-selector.tsx', 'utf8');
    expect(src).toContain('omnistu_currency');
    expect(src).toContain('disclosure.ratesClause');
    expect(src).toContain('ratesDisclosure(null)'); // honest default before the feed answers
    const disc = fs.readFileSync('lib/rates-disclosure.ts', 'utf8');
    expect(disc).toContain('checkout charges USD');
    expect(disc).toContain('temporarily unavailable');
    const priceSrc = fs.readFileSync('components/shared/localized-price.tsx', 'utf8');
    expect(priceSrc).toContain('display.title'); // converted price tooltip is source-aware too
    const price = fs.readFileSync('components/shared/localized-price.tsx', 'utf8');
    expect(price).toContain('/api/rates');
    expect(price).toContain('convertPrice');
    for (const f of [
      'components/shared/product/product-card.tsx',
      'components/shared/product/buy-box.tsx',
      'components/shared/search/product-horizontal-card.tsx',
    ]) {
      expect(fs.readFileSync(f, 'utf8')).toContain('LocalizedPrice');
    }
  });
  it('settlement surfaces stay USD (no display conversion in cart/checkout/orders)', () => {
    for (const f of [
      'app/(root)/cart/page.tsx',
      'app/(root)/place-order/page.tsx',
      'app/user/orders/page.tsx',
    ]) {
      if (fs.existsSync(f)) {
        expect(fs.readFileSync(f, 'utf8')).not.toContain('LocalizedPrice');
      }
    }
  });
  it('selector says what is translated and keeps readable footer text (source check)', () => {
    const src = fs.readFileSync('components/shared/header/global-selector.tsx', 'utf8');
    expect(src).toContain('Only menus and checkout labels are translated');
    expect(src).not.toMatch(/text-\[10px\] text-neutral-400/);
  });
});
