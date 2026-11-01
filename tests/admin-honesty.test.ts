import { syncOrderToSupabase } from '@/lib/providers/supabase-sync';

describe('supabase sync honesty (D9)', () => {
  const payload = {
    order_id: 'o1',
    customer_name: 'T',
    customer_email: 't@example.com',
    shipping_address: {},
    total_usd: 10,
  };
  beforeEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });
  it('reports unconfigured instead of claiming a local ledger write', async () => {
    const r = await syncOrderToSupabase(payload);
    expect(r).toEqual({ success: false, mode: 'unconfigured' });
  });
});

describe('admin data sources (D6/D7/D8)', () => {
  it('supplier-health route contains no fabricated metrics', () => {
    const src = require('fs').readFileSync('app/api/supplier-health/route.ts', 'utf8');
    expect(src).not.toMatch(/tokenValid: true/);
    expect(src).not.toMatch(/pingMs/);
    expect(src).not.toMatch(/1248/);
    expect(src).not.toMatch(/24,892/);
    expect(src).not.toMatch(/topKeywords/);
  });
  it('order summary contains no invented fallback numbers', () => {
    const src = require('fs').readFileSync('lib/actions/order.actions.ts', 'utf8');
    expect(src).not.toMatch(/1248/);
    expect(src).not.toMatch(/ord-omn-101/);
    expect(src).not.toMatch(/24892/);
  });
});

describe('admin overview and analytics carry no invented numbers (source check)', () => {
  const read = (f: string) => require('fs').readFileSync(f, 'utf8');
  it('overview page has no hardcoded revenue, margin, growth or repeat-buyer figures', () => {
    const src = read('app/admin/overview/page.tsx');
    for (const bad of [/24892/, /17,026/, /68\.4%/, /\+14%/, /24\.8%/, /Infinite JIT/]) expect(src).not.toMatch(bad);
  });
  it('analytics route returns no fabricated metrics', () => {
    const src = read('app/api/analytics/route.ts');
    for (const bad of [/24892/, /1248/, /topKeywords/, /mostViewedProducts/, /conversionRate/]) expect(src).not.toMatch(bad);
  });
});
