import { ordersEnabled, getPaymentMethodStatuses, isPaymentMethodAvailable } from '@/lib/payment-capabilities';
import { hideFixturesInPublic, fixtureExclusion } from '@/lib/test-fixture';

const keys = { PAYPAL_CLIENT_ID: 'x', PAYPAL_APP_SECRET: 'y', PAYPAL_API_URL: 'https://example.invalid', ENABLE_COD: 'true' };

describe('orders master switch', () => {
  it('production without ORDERS_ENABLED disables every method even with provider keys', () => {
    const env = { NODE_ENV: 'production', ...keys };
    expect(ordersEnabled(env)).toBe(false);
    expect(getPaymentMethodStatuses(env).every((s) => !s.enabled)).toBe(true);
    expect(isPaymentMethodAvailable('PayPal', env)).toBe(false);
    expect(isPaymentMethodAvailable('CashOnDelivery', env)).toBe(false);
  });
  it('production with ORDERS_ENABLED=true still needs provider keys', () => {
    expect(isPaymentMethodAvailable('PayPal', { NODE_ENV: 'production', ORDERS_ENABLED: 'true' })).toBe(false);
    expect(isPaymentMethodAvailable('PayPal', { NODE_ENV: 'production', ORDERS_ENABLED: 'true', ...keys })).toBe(true);
  });
  it('non-production is unchanged', () => {
    expect(isPaymentMethodAvailable('PayPal', { NODE_ENV: 'test', ...keys })).toBe(true);
  });
});

describe('fixture hiding', () => {
  it('hides in production unless SHOW_TEST_FIXTURES=true', () => {
    expect(hideFixturesInPublic({ NODE_ENV: 'production' })).toBe(true);
    expect(hideFixturesInPublic({ NODE_ENV: 'production', SHOW_TEST_FIXTURES: 'true' })).toBe(false);
    expect(hideFixturesInPublic({ NODE_ENV: 'test' })).toBe(false);
  });
  it('builds a prefix exclusion for both fixture prefixes', () => {
    expect(JSON.stringify(fixtureExclusion({ NODE_ENV: 'production' }))).toContain('cjstg-');
    expect(JSON.stringify(fixtureExclusion({ NODE_ENV: 'production' }))).toContain('fxt-');
    // Test-catalog rows stay hidden outside test checkout, in every runtime.
    expect(JSON.stringify(fixtureExclusion({ NODE_ENV: 'test' }))).toContain('cjt-');
    expect(fixtureExclusion({ NODE_ENV: 'test', TEST_CHECKOUT_MODE: 'true' })).toEqual({});
    expect(JSON.stringify(fixtureExclusion({ NODE_ENV: 'production', TEST_CHECKOUT_MODE: 'true' }))).not.toContain('cjt-');
  });
});
