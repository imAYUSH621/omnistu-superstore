import { assertDispatchSpendAllowed } from '@/lib/spend-guard';
import { dispatchOrderFulfillment } from '@/lib/fulfillment-dispatcher';

// D11: dispatch must fail CLOSED - no configured caps means no dispatch,
// and caps are operator-set env values, never invented or auto-activated.
const ADDRESS = {
  fullName: 'Sandbox Tester',
  streetAddress: '1 Test Way',
  city: 'Testville',
  postalCode: '00000',
  country: 'Testland',
  phone: '1234567890',
};

const ORDER = {
  id: 'test-order',
  shippingAddress: ADDRESS,
  user: { name: 'Sandbox Tester', email: 'user@example.com' },
  totalPrice: 24.99,
  orderitems: [{ name: 'Saffron', slug: 'royal-kashmiri-mongra-saffron', qty: 1, price: 24.99, image: '' }],
};

describe('spend guard (D11)', () => {
  const ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ENV };
  });

  it('fails closed when no caps are configured', () => {
    delete process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD;
    delete process.env.FULFILLMENT_MAX_ITEM_QTY;
    const r = assertDispatchSpendAllowed(ORDER);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/No spend caps configured/);
  });

  it('rejects non-positive or unparseable caps', () => {
    process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD = '0';
    process.env.FULFILLMENT_MAX_ITEM_QTY = 'abc';
    expect(assertDispatchSpendAllowed(ORDER).ok).toBe(false);
  });

  it('blocks orders above the configured total cap', () => {
    process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD = '10';
    process.env.FULFILLMENT_MAX_ITEM_QTY = '5';
    const r = assertDispatchSpendAllowed(ORDER);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/exceeds configured cap/);
  });

  it('blocks line items above the configured quantity cap', () => {
    process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD = '100';
    process.env.FULFILLMENT_MAX_ITEM_QTY = '1';
    const r = assertDispatchSpendAllowed({
      ...ORDER,
      orderitems: [{ ...ORDER.orderitems[0], qty: 3 }],
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/quantity 3 exceeds/);
  });

  it('fails closed on unknown order total', () => {
    process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD = '100';
    process.env.FULFILLMENT_MAX_ITEM_QTY = '5';
    expect(assertDispatchSpendAllowed({ ...ORDER, totalPrice: undefined }).ok).toBe(false);
  });

  it('allows dispatch within configured caps', () => {
    process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD = '100';
    process.env.FULFILLMENT_MAX_ITEM_QTY = '5';
    expect(assertDispatchSpendAllowed(ORDER).ok).toBe(true);
  });

  it('dispatcher returns SPEND_BLOCKED without caps, before any supplier call', async () => {
    delete process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD;
    delete process.env.FULFILLMENT_MAX_ITEM_QTY;
    const summary = await dispatchOrderFulfillment(ORDER);
    expect(summary.success).toBe(false);
    expect(summary.dispatches[0].status).toBe('SPEND_BLOCKED');
    expect(summary.dispatches[0].trackingNumber).toBeNull();
  });
});
