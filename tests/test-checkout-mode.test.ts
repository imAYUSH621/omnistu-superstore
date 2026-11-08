/**
 * Test checkout mode (owner acceptance testing on a protected deployment):
 * simulated payment only - no real charge, no supplier order, no shipment.
 */
import { getPaymentMethodStatuses, ordersEnabled, testCheckoutMode } from '@/lib/payment-capabilities';
import { isTestCatalogSlug, TEST_CATALOG_PREFIX } from '@/lib/test-fixture';
import * as fs from 'fs';

describe('test checkout mode', () => {
  it('is off unless TEST_CHECKOUT_MODE=true', () => {
    expect(testCheckoutMode({})).toBe(false);
    expect(testCheckoutMode({ TEST_CHECKOUT_MODE: 'false' })).toBe(false);
    expect(testCheckoutMode({ TEST_CHECKOUT_MODE: 'true' })).toBe(true);
  });

  it('enables orders in a production runtime only via explicit flags', () => {
    expect(ordersEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(ordersEnabled({ NODE_ENV: 'production', TEST_CHECKOUT_MODE: 'true' })).toBe(true);
  });

  it('exposes TestPayment only in test mode, with real methods still key-gated', () => {
    const off = getPaymentMethodStatuses({ NODE_ENV: 'production' });
    expect(off.some((s) => s.method === 'TestPayment')).toBe(false);
    const on = getPaymentMethodStatuses({ NODE_ENV: 'production', TEST_CHECKOUT_MODE: 'true' });
    const tp = on.find((s) => s.method === 'TestPayment');
    expect(tp?.enabled).toBe(true);
    expect(on.find((s) => s.method === 'PayPal')?.enabled).toBe(false);
  });

  it('recognises test catalog slugs without making them fixtures', () => {
    expect(isTestCatalogSlug(`${TEST_CATALOG_PREFIX}abc`)).toBe(true);
    expect(isTestCatalogSlug('cjstg-abc')).toBe(false);
    expect(isTestCatalogSlug('normal-slug')).toBe(false);
  });

  it('server actions re-check mode, ownership and payment method', () => {
    const src = fs.readFileSync('lib/actions/order.actions.ts', 'utf8');
    expect(src).toContain("if (!testCheckoutMode()) throw new Error('Test checkout is not enabled')");
    expect(src).toContain("order.paymentMethod !== 'TestPayment'");
    expect(src).toContain('isTestCatalogSlug(i.slug)');
    const cart = fs.readFileSync('lib/actions/cart.actions.ts', 'utf8');
    expect(cart).toContain('isTestCatalogSlug(product.slug) && !testCheckoutMode()');
  });

  it('simulated settlement has no external side effects', () => {
    const src = fs.readFileSync('lib/order-settlement.ts', 'utf8');
    const sim = src.slice(src.indexOf('updateOrderToPaidSimulated'));
    expect(sim).toContain("status: 'SIMULATED'");
    expect(sim).not.toContain('dispatchOrderFulfillment(');
    expect(sim).not.toContain('sendPurchaseReceipt(');
    expect(sim).not.toContain('sendOrderConfirmationEmail(');
    expect(sim).not.toContain('syncOrderToSupabase(');
  });

  it('UI labels the simulation at catalog, payment and order surfaces', () => {
    const buyBox = fs.readFileSync('components/shared/product/buy-box.tsx', 'utf8');
    expect(buyBox).toContain("data-testid='test-catalog-note'");
    const payPage = fs.readFileSync('app/(root)/payment-method/page.tsx', 'utf8');
    expect(payPage).toContain("data-testid='test-checkout-banner'");
    const table = fs.readFileSync('app/(root)/order/[id]/order-details-table.tsx', 'utf8');
    expect(table).toContain("data-testid='test-order-banner'");
    expect(table).toContain('copy.simulatePaid');
    expect(require('@/lib/order-detail-language').ORDER_DETAIL_COPY.EN.simulatePaid).toBe('Simulate payment (TEST - no real charge)');
  });
});

describe('insertOrderSchema in test checkout mode', () => {
  // Regression: createOrder passed isPaymentMethodAvailable('TestPayment') but
  // then failed insertOrderSchema.parse with 'Invalid payment method', so the
  // simulated place-order leg could never succeed.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { insertOrderSchema } = require('@/lib/validators');

  const baseOrder = {
    userId: 'user-1',
    shippingAddress: {
      fullName: 'Flow Test',
      streetAddress: '1 Test Street',
      city: 'Testville',
      postalCode: '110001',
      country: 'IN',
    },
    itemsPrice: '10.00',
    shippingPrice: '0.00',
    taxPrice: '0.00',
    totalPrice: '10.00',
  };

  const prev = process.env.TEST_CHECKOUT_MODE;
  afterEach(() => {
    if (prev === undefined) delete process.env.TEST_CHECKOUT_MODE;
    else process.env.TEST_CHECKOUT_MODE = prev;
  });

  it('accepts TestPayment only while TEST_CHECKOUT_MODE=true', () => {
    process.env.TEST_CHECKOUT_MODE = 'true';
    expect(insertOrderSchema.parse({ ...baseOrder, paymentMethod: 'TestPayment' }).paymentMethod).toBe('TestPayment');
  });

  it('rejects TestPayment when test checkout mode is off', () => {
    delete process.env.TEST_CHECKOUT_MODE;
    expect(() => insertOrderSchema.parse({ ...baseOrder, paymentMethod: 'TestPayment' })).toThrow('Invalid payment method');
  });

  it('still rejects unknown methods even in test mode', () => {
    process.env.TEST_CHECKOUT_MODE = 'true';
    expect(() => insertOrderSchema.parse({ ...baseOrder, paymentMethod: 'MagicMoney' })).toThrow('Invalid payment method');
  });
});

it('place-order failure is never silent: the form toasts the server message', () => {
  // Regression: a failed createOrder with no redirectTo previously reset the
  // idempotency key and re-enabled the button with zero user feedback.
  const src = fs.readFileSync('app/(root)/place-order/place-order-form.tsx', 'utf8');
  expect(src).toContain("variant: 'destructive'");
  expect(src).toContain('res.message');
});

it('simulated tax and shipping are labeled as TEST estimates, never real rates', () => {
  const table = fs.readFileSync('app/(root)/order/[id]/order-details-table.tsx', 'utf8');
  expect(table).toContain('copy.testTax');
  expect(require('@/lib/order-detail-language').ORDER_DETAIL_COPY.EN.testTax).toBe('Simulated tax (TEST estimate - not a real tax rate)');
  expect(table).toContain('copy.testShippingRate');
  expect(require('@/lib/order-detail-language').ORDER_DETAIL_COPY.EN.testShippingRate).toBe('Simulated shipping (TEST estimate - not a real rate)');
  const page = fs.readFileSync('app/(root)/place-order/page.tsx', 'utf8');
  expect(page).toContain("data-testid='test-estimates-note'");
  expect(page).toContain('not real tax or shipping rates');
});

it('auth origin falls back to the deployment URL when no fixed public URL exists', () => {
  // Shareable-link access is per deployment URL; a hardcoded alias origin
  // bounces share-link users to the Vercel login wall after sign-in.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { authOrigin } = require('@/lib/auth-origin');
  const prevN = process.env.NEXTAUTH_URL;
  const prevV = process.env.VERCEL_URL;
  delete process.env.NEXTAUTH_URL;
  process.env.VERCEL_URL = 'my-app-abc123.vercel.app';
  expect(authOrigin()).toBe('https://my-app-abc123.vercel.app');
  process.env.NEXTAUTH_URL = 'https://fixed.example.com';
  expect(authOrigin()).toBe('https://fixed.example.com');
  if (prevN === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = prevN;
  if (prevV === undefined) delete process.env.VERCEL_URL; else process.env.VERCEL_URL = prevV;
});
