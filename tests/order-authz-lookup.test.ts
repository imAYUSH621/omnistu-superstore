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
import { lookupThrottled, lookupOrder, LOOKUP_ATTEMPTS } from '@/lib/chat';

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
  it('refuses admin delivery of a qualified non-shipping test order', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'admin' } });
    mockFindFirst.mockResolvedValue({ isPaid: true, paymentMethod: 'TestPayment', paymentNote: 'QUALIFIED TEST ONLY - simulated checkout' });
    const r = await deliverOrder('o1');
    expect(r).toMatchObject({success:false,message:'No shipment exists for qualified test checkout'});
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it('cannot turn customer payment into delivery when supplier verification is OFF', async () => {
    delete process.env.CJ_LIFECYCLE_RECONCILIATION_ENABLED;
    mockAuth.mockResolvedValue({ user: { id: 'a1', role: 'admin' } });
    mockFindFirst.mockResolvedValue({ isPaid: true, paymentMethod:'PayPal' });
    const r = await deliverOrder('o1');
    expect(r.success).toBe(false);
    expect(r.message).toContain('verification is OFF');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('chat order lookup', () => {
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
    process.env.CHAT_ORDER_LOOKUP = 'enabled';
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
    process.env.CHAT_ORDER_LOOKUP = 'enabled';
    const f = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-NOKEY-2 for k@z.co');
    expect(f).not.toHaveBeenCalled();
    expect(r).toMatch(/unavailable/);
    process.env = saved;
  });
});

describe('chat order lookup: rpc only, never a table probe', () => {
  const env = () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.CHAT_ORDER_LOOKUP = 'enabled';
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
  it('never probes the orders table when the function is missing (404)', async () => {
    env();
    const f = jest.fn(async () => ({ ok: false, status: 404, json: async () => ({ code: 'PGRST202', message: 'Could not find the function public.lookup_order(p_email, p_order_id) in the schema cache' }) }));
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-RPC-2 for r@z.co');
    expect(f).toHaveBeenCalledTimes(1);
    expect(String((f.mock.calls[0] as unknown[])[0])).toContain('/rpc/lookup_order');
    expect(r).toMatch(/unavailable/);
  });
  it('does NOT fall back on other errors (e.g. 401/500) and reports unavailable', async () => {
    env();
    const f = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-RPC-3 for r@z.co');
    expect(f).toHaveBeenCalledTimes(1);
    expect(r).toMatch(/unavailable/);
  });
});

describe('chat order lookup: fail closed when disabled', () => {
  it('never calls any Supabase endpoint with CHAT_ORDER_LOOKUP unset', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.CHAT_ORDER_LOOKUP;
    const f = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-OFF-1 for r@z.co');
    expect(f).not.toHaveBeenCalled();
    expect(r).toContain('turned off');
  });
  it('any value other than exactly "enabled" stays closed', async () => {
    process.env.CHAT_ORDER_LOOKUP = 'true';
    const f = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = f;
    const r = await lookupOrder('order OMN-OFF-2 for r@z.co');
    expect(f).not.toHaveBeenCalled();
    expect(r).toContain('turned off');
    delete process.env.CHAT_ORDER_LOOKUP;
  });
});

describe('chat order lookup: id case normalisation', () => {
  it('sends a UUID order id lowercase even when the customer typed it in capitals', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.CHAT_ORDER_LOOKUP = 'enabled';
    const f = jest.fn(async () => ({ ok: true, status: 200, json: async () => [] }));
    (global as unknown as { fetch: unknown }).fetch = f;
    await lookupOrder('order AAAAAAAA-1111-4111-8111-111111111111 for c@z.co');
    const [, init] = f.mock.calls[0] as unknown as [string, { body: string }];
    expect(JSON.parse(init.body).p_order_id).toBe('aaaaaaaa-1111-4111-8111-111111111111');
  });
  it('keeps legacy OMN- ids uppercase', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.CHAT_ORDER_LOOKUP = 'enabled';
    const f = jest.fn(async () => ({ ok: true, status: 200, json: async () => [] }));
    (global as unknown as { fetch: unknown }).fetch = f;
    await lookupOrder('order omn-abc-123 for d@z.co');
    const [, init] = f.mock.calls[0] as unknown as [string, { body: string }];
    expect(JSON.parse(init.body).p_order_id).toBe('OMN-ABC-123');
  });
});
