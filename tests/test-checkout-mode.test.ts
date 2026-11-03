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
    expect(table).toContain('Simulate payment (TEST - no real charge)');
  });
});
