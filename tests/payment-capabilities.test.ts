import { getPaymentMethodStatuses, isPaymentMethodAvailable } from '@/lib/payment-capabilities';

describe('payment capability gating', () => {
  it('disables every method when nothing is configured', () => {
    const s = getPaymentMethodStatuses({});
    expect(s.map((x) => x.method)).toEqual(['PayPal', 'Stripe', 'CashOnDelivery']);
    expect(s.every((x) => !x.enabled)).toBe(true);
  });
  it('PayPal needs id, secret and API URL', () => {
    expect(isPaymentMethodAvailable('PayPal', { PAYPAL_CLIENT_ID: 'a', PAYPAL_APP_SECRET: 'b' })).toBe(false);
    expect(isPaymentMethodAvailable('PayPal', { PAYPAL_CLIENT_ID: 'a', PAYPAL_APP_SECRET: 'b', PAYPAL_API_URL: 'u' })).toBe(true);
  });
  it('Stripe needs secret and publishable key', () => {
    expect(isPaymentMethodAvailable('Stripe', { STRIPE_SECRET_KEY: 'a' })).toBe(false);
    expect(isPaymentMethodAvailable('Stripe', { STRIPE_SECRET_KEY: 'a', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'b' })).toBe(true);
  });
  it('cash on delivery is an explicit opt-in', () => {
    expect(isPaymentMethodAvailable('CashOnDelivery', {})).toBe(false);
    expect(isPaymentMethodAvailable('CashOnDelivery', { ENABLE_COD: 'yes' })).toBe(false);
    expect(isPaymentMethodAvailable('CashOnDelivery', { ENABLE_COD: 'true' })).toBe(true);
  });
  it('unknown methods are never available', () => {
    expect(isPaymentMethodAvailable('Bitcoin', { ENABLE_COD: 'true' })).toBe(false);
  });
});
