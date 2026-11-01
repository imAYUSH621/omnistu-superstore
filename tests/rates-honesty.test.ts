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
  it('selector labels each rate source separately (source check)', () => {
    const src = fs.readFileSync('components/shared/header/global-selector.tsx', 'utf8');
    for (const k of ['default_safe', 'env_override', 'live_api']) expect(src).toContain(k);
  });
});
