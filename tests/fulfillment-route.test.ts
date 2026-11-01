/**
 * D18: the fulfillment dispatch route must be admin-only and must never
 * fabricate customer/address/product data for a supplier order.
 */

const mockAuth = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));

import { POST } from '@/app/api/fulfillment/route';

function req(body: unknown) {
  return new Request('http://localhost/api/fulfillment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const fullBody = {
  order_id: 'o-1',
  customer_name: 'Jane Demo',
  customer_email: 'jane@example.com',
  shipping_address: '1 Test Way',
  city: 'Testville',
  state_zip: 'TS 00000',
  country_code: 'US',
  phone: '+1-555-0100',
  vendor: 'PRINTIFY',
  product_id: 'p1',
  variant_id: '42',
};

beforeEach(() => {
  jest.restoreAllMocks();
  delete process.env.PRINTIFY_API;
  delete process.env.PRINTIFY_SHOP_ID;
});

describe('fulfillment route access (D18)', () => {
  test('rejects anonymous callers with 403', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(req(fullBody));
    expect(res.status).toBe(403);
  });

  test('rejects non-admin callers with 403', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1', role: 'user' } });
    const res = await POST(req(fullBody));
    expect(res.status).toBe(403);
  });
});

describe('fulfillment route honesty (D18)', () => {
  test('rejects missing customer/address fields with 400 instead of fabricating', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'a1', role: 'admin' } });
    const spy = jest.spyOn(global, 'fetch');
    const res = await POST(req({ order_id: 'o-2', vendor: 'PRINTIFY' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.missing).toEqual(expect.arrayContaining(['customer_name', 'customer_email', 'shipping_address', 'city', 'state_zip', 'phone']));
    expect(spy).not.toHaveBeenCalled();
  });

  test('admin with complete fields but unconfigured supplier gets HELD_IN_QUEUE, no dispatch', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'a1', role: 'admin' } });
    const res = await POST(req(fullBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.receipt.status).toBe('HELD_IN_QUEUE');
  });

  test('Printify dispatch without product/variant ids is rejected, never defaulted', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'a1', role: 'admin' } });
    process.env.PRINTIFY_API = 'sandbox-token';
    process.env.PRINTIFY_SHOP_ID = 'sandbox-shop';
    const { product_id, variant_id, ...noIds } = fullBody;
    const res = await POST(req(noIds));
    expect(res.status).toBe(400);
  });

  test('route source contains no fabricated fallback data', () => {
    const src = require('fs').readFileSync('app/api/fulfillment/route.ts', 'utf8');
    for (const fake of ['5551234567', '123 Main St', '548 Market St', "'94105'", "'San Francisco'", 'Valued Customer', 'billing@omnistu.com', 'support@omnistu.com', '29044718', '6ae20089e5cd851f5d0f80ec', 'BG-LUX-001']) {
      expect(src).not.toContain(fake);
    }
  });
});
