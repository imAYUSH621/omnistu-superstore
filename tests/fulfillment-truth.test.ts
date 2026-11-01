import {
  dispatchOrderFulfillment,
  validateDispatchAddress,
} from '@/lib/fulfillment-dispatcher';
import { aggregateDispatchStatus } from '@/lib/fulfillment-persistence';

const fullAddress = {
  fullName: 'Test Buyer',
  streetAddress: '221B Baker Street',
  city: 'London',
  postalCode: 'NW1 6XE',
  country: 'GB',
  phone: '+44 20 7946 0958',
};

const baseOrder = {
  id: 'order-test-1',
  orderitems: [{ name: 'Generic Gadget', slug: 'generic-gadget', qty: 1, price: '9.99' }],
  shippingAddress: fullAddress,
  user: { name: 'Test Buyer', email: 'buyer@example.com' },
  totalPrice: '9.99',
};

// D11: these honesty tests exercise the dispatch path itself, so the
// fail-closed spend guard must be satisfied with explicit test caps.
beforeEach(() => {
  process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD = '100000';
  process.env.FULFILLMENT_MAX_ITEM_QTY = '100';
});

describe('validateDispatchAddress (D5)', () => {
  it('accepts a complete address', () => {
    expect(validateDispatchAddress(fullAddress)).toEqual({ ok: true, missing: [] });
  });
  it('lists every missing field instead of substituting defaults', () => {
    const r = validateDispatchAddress({ fullName: 'X', city: 'London' });
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['streetAddress', 'postalCode', 'country', 'phone']);
  });
  it('rejects empty/whitespace values', () => {
    expect(validateDispatchAddress({ ...fullAddress, phone: '  ' }).missing).toEqual(['phone']);
  });
});

describe('dispatchOrderFulfillment honesty (D3)', () => {
  it('blocks dispatch on an incomplete address and ships nothing', async () => {
    const r = await dispatchOrderFulfillment({
      ...baseOrder,
      shippingAddress: { fullName: 'X' },
    });
    expect(r.success).toBe(false);
    expect(r.dispatches[0].status).toBe('ADDRESS_INCOMPLETE');
    expect(r.dispatches[0].trackingNumber).toBeNull();
    expect(r.dispatches[0].message).toMatch(/streetAddress/);
  });

  it('marks key-less dispatch as SIMULATED with no fabricated tracking or carrier', async () => {
    delete process.env.CJ_API_KEY;
    delete process.env.FULFILLMENT_API_KEY;
    const r = await dispatchOrderFulfillment(baseOrder);
    expect(r.dispatches).toHaveLength(1);
    const d = r.dispatches[0];
    expect(d.status).toBe('SIMULATED');
    expect(d.trackingNumber).toBeNull();
    expect(d.carrier).toBeNull();
    expect(d.supplierOrderId).toBeNull();
    expect(d.message).toMatch(/SIMULATED/);
    expect(r.success).toBe(false);
  });

  it('reports gourmet items as UNROUTED, never as dispatched', async () => {
    const r = await dispatchOrderFulfillment({
      ...baseOrder,
      orderitems: [{ name: 'Kashmiri Saffron', slug: 'royal-saffron', qty: 1, price: '24.99' }],
    });
    const d = r.dispatches[0];
    expect(d.supplier).toBe('SPECIALTY_GOURMET');
    expect(d.status).toBe('UNROUTED');
    expect(d.trackingNumber).toBeNull();
    expect(r.success).toBe(false);
  });

  it('never invents a tracking number anywhere in the no-key path', async () => {
    const r = await dispatchOrderFulfillment({
      ...baseOrder,
      orderitems: [
        { name: 'Hoodie', slug: 'hoodie-x', qty: 1, price: '30' },
        { name: 'Gadget', slug: 'gadget-y', qty: 2, price: '10' },
        { name: 'Chai', slug: 'chai-z', qty: 1, price: '8' },
      ],
    });
    for (const d of r.dispatches) {
      expect(d.trackingNumber).toBeNull();
      expect(d.status).not.toBe('DISPATCHED');
    }
  });
});

describe('aggregateDispatchStatus (D4)', () => {
  it('collapses uniform statuses', () => {
    expect(aggregateDispatchStatus([
      { status: 'SIMULATED' },
      { status: 'SIMULATED' },
    ] as any)).toBe('SIMULATED');
  });
  it('marks mixed dispatched states as PARTIAL', () => {
    expect(aggregateDispatchStatus([
      { status: 'DISPATCHED' },
      { status: 'QUEUED' },
    ] as any)).toBe('PARTIAL');
  });
  it('handles the empty case', () => {
    expect(aggregateDispatchStatus([])).toBe('NO_ITEMS');
  });
});
