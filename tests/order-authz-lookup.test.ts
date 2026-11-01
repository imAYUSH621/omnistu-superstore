/**
 * Server actions are reachable outside the UI, so authorization must live in
 * the action. Also pins the chat order-lookup query shape and throttle.
 */
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockTransaction = jest.fn();
const mockAuth = jest.fn();

jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      findUnique: jest.fn(),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
jest.mock('@/lib/actions/cart.actions', () => ({ getMyCart: jest.fn() }));
jest.mock('@/lib/actions/user.actions', () => ({ getUserById: jest.fn() }));
jest.mock('@/email', () => ({ sendPurchaseReceipt: jest.fn() }));
jest.mock('@/lib/mailer', () => ({ sendOrderConfirmationEmail: jest.fn(async () => ({})) }));
jest.mock('@/lib/providers/supabase-sync', () => ({ syncOrderToSupabase: jest.fn(async () => ({})) }));
jest.mock('@/lib/fulfillment-dispatcher', () => ({ dispatchOrderFulfillment: jest.fn(async () => ({ dispatches: [] })) }));
jest.mock('@/lib/fulfillment-persistence', () => ({ persistDispatchSummary: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { updateOrderToPaidCOD, deliverOrder } from '@/lib/actions/order.actions';
import { buildOrderLookupQuery, lookupThrottled, lookupOrder, LOOKUP_ATTEMPTS } from '@/lib/chat';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateOrderToPaidCOD authorization', () => {
  it('rejects an anonymous caller without touching the order', async () => {
    mockAuth.mockResolvedValue(null);
    const r = await updateOrderToPaidCOD('o1');
    expect(r.success).toBe(false);
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
  it('rejects a signed-in non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'user' } });
    const r = await updateOrderToPaidCOD('o1');
    expect(r.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
  it('rejects an admin on a non-COD order', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'admin' } });
    mockFindFirst.mockResolvedValue({ paymentMethod: 'PayPal' });
    const r = await updateOrderToPaidCOD('o1');
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/Cash on Delivery/);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
  it('lets an admin through on a COD order (reaches the paid flow)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'admin' } });
    mockFindFirst
      .mockResolvedValueOnce({ paymentMethod: 'CashOnDelivery' })
      .mockResolvedValueOnce(null); // updateOrderToPaid's own lookup -> "Order not found"
    const r = await updateOrderToPaidCOD('o1');
    expect(mockFindFirst).toHaveBeenCalledTimes(2);
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/Order not found/);
  });
});

describe('deliverOrder authorization', () => {
  it('rejects non-admin without reading or updating', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'user' } });
    const r = await deliverOrder('o1');
    expect(r.success).toBe(false);
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it('lets an admin mark a paid order delivered', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'admin' } });
    mockFindFirst.mockResolvedValue({ isPaid: true });
    const r = await deliverOrder('o1');
    expect(r.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('chat order lookup', () => {
  it('builds an exact-match query with a fixed column list and no or/ilike', () => {
    const q = buildOrderLookupQuery('OMN-884920', 'a@b.co');
    expect(q.get('order_id')).toBe('eq.OMN-884920');
    expect(q.get('customer_email')).toBe('eq.a@b.co');
    expect(q.get('select')).toBe('order_id,customer_email,status,tracking_number,carrier,created_at');
    expect(q.get('limit')).toBe('1');
    expect(q.has('or')).toBe(false);
    expect(q.toString()).not.toMatch(/ilike/);
  });
  it('encodes hostile email characters as one parameter value, not extra params', () => {
    const q = buildOrderLookupQuery('OMN-12345', 'x@y.co&or=(id.gt.0)');
    expect([...q.keys()].sort()).toEqual(['customer_email', 'limit', 'order_id', 'select']);
  });
  it('throttles repeated attempts per order+email and not other pairs', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < LOOKUP_ATTEMPTS; i++) expect(lookupThrottled('OMN-THR-1', 't@x.co', t0 + i)).toBe(false);
    expect(lookupThrottled('OMN-THR-1', 't@x.co', t0 + 10)).toBe(true);
    expect(lookupThrottled('OMN-THR-2', 't@x.co', t0 + 10)).toBe(false);
    expect(lookupThrottled('OMN-THR-1', 't@x.co', t0 + 16 * 60_000)).toBe(false);
  });
  it('never sends the service-role key and uses the anon key', async () => {
    const saved = { ...process.env };
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-secret';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    const f = jest.fn(async () => ({ ok: true, json: async () => [] }));
    (global as unknown as { fetch: unknown }).fetch = f;
    await lookupOrder('order OMN-NOKEY-1 for k@z.co');
    const [, init] = f.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(init.headers.apikey).toBe('anon-key');
    expect(JSON.stringify(init.headers)).not.toMatch(/service-secret/);
    process.env = saved;
  });
  it('does not query when only the anon-less environment exists but a service key is set', async () => {
    const saved = { ...process.env };
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-secret';
    const f = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-NOKEY-2 for k@z.co');
    expect(f).not.toHaveBeenCalled();
    expect(r).toMatch(/unavailable/);
    process.env = saved;
  });
});

describe('chat order lookup: rpc first, table fallback only on 404', () => {
  const env = () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  };
  it('posts a JSON body to rpc/lookup_order and returns the row', async () => {
    env();
    const f = jest.fn(async () => ({ ok: true, status: 200, json: async () => [{ order_id: 'OMN-RPC-1', status: 'PAID' }] }));
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-RPC-1 for r@z.co');
    const [u, init] = f.mock.calls[0] as unknown as [string, { method: string; body: string }];
    expect(u).toBe('https://example.supabase.co/rest/v1/rpc/lookup_order');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ p_order_id: 'OMN-RPC-1', p_email: 'r@z.co' });
    expect(f).toHaveBeenCalledTimes(1);
    expect(r).toMatch(/OMN-RPC-1/);
  });
  it('falls back to the exact-match table query when the function is missing (404)', async () => {
    env();
    const f = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ code: 'PGRST202', message: 'Could not find the function public.lookup_order(p_email, p_order_id) in the schema cache' }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ order_id: 'OMN-RPC-2' }] });
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-RPC-2 for r@z.co');
    expect(f).toHaveBeenCalledTimes(2);
    expect(String((f.mock.calls[1] as unknown[])[0])).toMatch(/\/rest\/v1\/orders\?.*order_id=eq\.OMN-RPC-2/);
    expect(r).toMatch(/OMN-RPC-2/);
  });
  it('does NOT fall back on other errors (e.g. 401/500) and reports no match', async () => {
    env();
    const f = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-RPC-3 for r@z.co');
    expect(f).toHaveBeenCalledTimes(1);
    expect(r).toMatch(/No matching order/);
  });
});

describe('chat order lookup: fallback is limited to the missing-function signature', () => {
  const setup = (first: unknown) => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const f = jest.fn().mockResolvedValueOnce(first).mockResolvedValue({ ok: true, status: 200, json: async () => [{ order_id: 'LEAK' }] });
    (global as unknown as { fetch: unknown }).fetch = f;
    return f;
  };
  it('arbitrary 404 (different body) does not fall back', async () => {
    const f = setup({ ok: false, status: 404, json: async () => ({ message: 'not found' }) });
    expect(await lookupOrder('order OMN-A-1 for r@z.co')).toMatch(/No matching order/);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('404 for a different function does not fall back', async () => {
    const f = setup({ ok: false, status: 404, json: async () => ({ code: 'PGRST202', message: 'Could not find the function public.other' }) });
    expect(await lookupOrder('order OMN-A-2 for r@z.co')).toMatch(/No matching order/);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('404 with unparseable body does not fall back', async () => {
    const f = setup({ ok: false, status: 404, json: async () => { throw new Error('x'); } });
    expect(await lookupOrder('order OMN-A-3 for r@z.co')).toMatch(/No matching order/);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('empty rpc result is a no-match without table fallback', async () => {
    const f = setup({ ok: true, status: 200, json: async () => [] });
    expect(await lookupOrder('order OMN-A-4 for r@z.co')).toMatch(/No matching order/);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
