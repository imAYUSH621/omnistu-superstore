import { PAYMENT_METHODS } from '@/lib/constants';

// A payment method is usable only when the server has what it needs.
// Server-only: reads env that must never reach the client. This reports
// configuration presence, not that a provider account is live or approved.
// Cash on delivery is an explicit opt-in (ENABLE_COD=true) because it needs
// supplier and fulfilment support that is not assumed.
export type PaymentMethodStatus = { method: string; enabled: boolean; reason?: string };

export function getPaymentMethodStatuses(env: Record<string, string | undefined> = process.env): PaymentMethodStatus[] {
  return PAYMENT_METHODS.map((method) => {
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
}

export function isPaymentMethodAvailable(method: string, env: Record<string, string | undefined> = process.env): boolean {
  return getPaymentMethodStatuses(env).some((s) => s.method === method && s.enabled);
}
