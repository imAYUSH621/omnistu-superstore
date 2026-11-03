import { syncOrderToSupabase } from '@/lib/providers/supabase-sync';

const payload = { order_id: 'o1', customer_name: 'n', customer_email: 'e@x.test', shipping_address: {}, total_usd: 1, status: 'PAID' };

describe('order mirror is opt-in', () => {
  const env = { ...process.env };
  afterEach(() => { process.env = { ...env }; jest.restoreAllMocks(); });

  it('never calls the network when URL and key are configured but the flag is unset', async () => {
    process.env.SUPABASE_URL = 'https://example.invalid';
    process.env.SUPABASE_ANON_KEY = 'k';
    delete process.env.CLOUD_ORDER_MIRROR_ENABLED;
    const f = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));
    expect(await syncOrderToSupabase(payload)).toEqual({ success: false, mode: 'disabled' });
    expect(f).not.toHaveBeenCalled();
  });

  it('flag true but unconfigured still writes nothing', async () => {
    process.env.CLOUD_ORDER_MIRROR_ENABLED = 'true';
    delete process.env.SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const f = jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'));
    expect((await syncOrderToSupabase(payload)).mode).toBe('unconfigured');
    expect(f).not.toHaveBeenCalled();
  });
});
