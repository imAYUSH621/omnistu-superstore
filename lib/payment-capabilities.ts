import { PAYMENT_METHODS } from '@/lib/constants';

// A payment method is usable only when the server has what it needs.
// Server-only: reads env that must never reach the client. This reports
// configuration presence, not that a provider account is live or approved.
// Cash on delivery is an explicit opt-in (ENABLE_COD=true) because it needs
// supplier and fulfilment support that is not assumed.
export type PaymentMethodStatus = { method: string; enabled: boolean; reason?: string };

// Master switch. In a production runtime no payment method is usable unless ORDERS_ENABLED=true is
// set on purpose, whatever provider keys happen to be present. Outside production it does not apply.
// Test checkout: an explicit, clearly-labeled simulation mode for owner acceptance
// testing on a protected deployment. Simulated payment only - no real charge,
// no supplier order, no real shipment. Never a path to real commerce.
export function testCheckoutMode(env: Record<string, string | undefined> = process.env): boolean {
  return env.TEST_CHECKOUT_MODE === 'true';
}

export function ordersEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== 'production' || env.ORDERS_ENABLED === 'true' || testCheckoutMode(env);
}

export function getPaymentMethodStatuses(env: Record<string, string | undefined> = process.env): PaymentMethodStatus[] {
  const statuses = [...new Set(PAYMENT_METHODS)].filter((method) => method !== 'TestPayment').map((method) => {
    if (!ordersEnabled(env)) return { method, enabled: false, reason: 'Not available yet' };
    if (method === 'PayPal') {
      const ok = !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_APP_SECRET && env.PAYPAL_API_URL);
      return ok ? { method, enabled: true } : { method, enabled: false, reason: 'Not available yet' };
    }
    if (method === 'Stripe') {
      const ok = !!(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      return ok ? { method, enabled: true } : { method, enabled: false, reason: 'Not available yet' };
    }
    if (method === 'CashOnDelivery') {
      return env.ENABLE_COD === 'true' ? { method, enabled: true } : { method, enabled: false, reason: 'Not available yet' };
    }
    return { method, enabled: false, reason: 'Not available yet' };
  });
  if (testCheckoutMode(env)) statuses.push({ method: 'TestPayment', enabled: true });
  return statuses;
}

export function isPaymentMethodAvailable(method: string, env: Record<string, string | undefined> = process.env): boolean {
  return getPaymentMethodStatuses(env).some((s) => s.method === method && s.enabled);
}
