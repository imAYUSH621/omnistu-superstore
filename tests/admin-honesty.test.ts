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

describe('admin overview separates unavailable from zero (source check)', () => {
  const read = (f: string) => require('fs').readFileSync(f, 'utf8');
  it('summary flags failure and page renders Unavailable', () => {
    expect(read('lib/actions/order.actions.ts')).toMatch(/unavailable: true/);
    const src = read('app/admin/overview/page.tsx');
    expect(src).toMatch(/Unavailable/);
    expect(src).not.toMatch(/Real-time CJ|Telemetry|Free-Tier Postgres Meter/);
  });
});

describe('admin overview has no demo hub (source check)', () => {
  it('demo hub with invented orders, supplier status and meters is gone', () => {
    const fs = require('fs');
    expect(fs.existsSync('app/admin/overview/admin-interactive-hub.tsx')).toBe(false);
    expect(fs.readFileSync('app/admin/overview/page.tsx', 'utf8')).not.toMatch(/AdminInteractiveHub/);
  });
});

describe('admin overview revenue counts paid orders only (source check)', () => {
  it('sum and monthly chart filter on isPaid; labels do not overstate', () => {
    const fs = require('fs');
    const a = fs.readFileSync('lib/actions/order.actions.ts', 'utf8');
    expect(a).toMatch(/where: \{ isPaid: true \}/);
    expect(a).toMatch(/WHERE "isPaid" = true/);
    const pg = fs.readFileSync('app/admin/overview/page.tsx', 'utf8');
    expect(pg).not.toMatch(/Total Gross Revenue|Live Catalog SKUs|Revenue Velocity|Direct Orders/);
  });
});
