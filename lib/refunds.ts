/**
 * Refund execution path (G3). Fail-closed by construction:
 * a real provider refund runs only when ALL of these hold:
 *   1. REFUNDS_LIVE_ENABLED === 'true' (explicit owner opt-in)
 *   2. the provider's live credentials exist in env
 *   3. the order carries a matching provider reference
 * Every other case returns SIMULATED or FAILED with the exact reason, and
 * no code path claims money moved when none did. Tests mock fetch and
 * prove no provider call happens without keys + flag.
 */

export type RefundResult = {
  // UNKNOWN = the provider call's outcome is uncertain (network
  // error/timeout after the request may have landed). Never blind-retry an
  // UNKNOWN: reconcile with the provider first.
  status: 'EXECUTED' | 'SIMULATED' | 'FAILED' | 'UNKNOWN';
  providerRef?: string;
  note: string;
};

type RefundInput = {
  paymentMethod: string | null | undefined;
  paymentResult: unknown;
  amount: number;
  orderTotal: number;
  alreadyRefunded: number;
  idempotencyKey: string;
};

const paypalBase = () => process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

function paypalCaptureId(paymentResult: unknown): string | null {
  const pr = paymentResult as {
    id?: string;
    purchase_units?: { payments?: { captures?: { id?: string }[] } }[];
  } | null;
  return pr?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? pr?.id ?? null;
}

function paypalCurrency(paymentResult: unknown): string | null {
  const pr = paymentResult as {
    purchase_units?: { payments?: { captures?: { amount?: { currency_code?: string } }[] } }[];
  } | null;
  return pr?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code ?? null;
}

async function paypalRefund(captureId: string, amount: number, idempotencyKey: string): Promise<RefundResult> {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
  const tokenRes = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!tokenRes.ok) return { status: 'FAILED', note: `PayPal auth failed (HTTP ${tokenRes.status}).` };
  const { access_token } = await tokenRes.json();
  const res = await fetch(`${paypalBase()}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}`, 'PayPal-Request-Id': idempotencyKey },
    body: JSON.stringify({ amount: { value: toMajorString(amount, 'USD'), currency_code: 'USD' } }),
  });
  if (!res.ok) return { status: 'FAILED', note: `PayPal refund failed (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}` };
  const data = await res.json();
  return { status: 'EXECUTED', providerRef: data.id, note: `PayPal refund ${data.id} executed.` };
}

async function stripeRefund(paymentIntentId: string, amount: number, idempotencyKey: string): Promise<RefundResult> {
  const res = await fetch('https://api.stripe.com/v1/refunds', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey,
    },
    body: new URLSearchParams({
      payment_intent: paymentIntentId,
      amount: String(toMinorUnits(amount, 'USD')),
    }),
  });
  const data = await res.json();
  if (!res.ok) return { status: 'FAILED', note: `Stripe refund failed: ${data?.error?.message ?? `HTTP ${res.status}`}` };
  return { status: 'EXECUTED', providerRef: data.id, note: `Stripe refund ${data.id} executed.` };
}

// Currencies this store actually accepts at checkout, with their ISO
// 4217 minor-unit exponents. Refund minor-unit conversion follows THIS
// table, never a blanket two-decimal assumption (JPY has 0 decimals).
// Any currency not listed fails closed before provider contact.
export const SUPPORTED_REFUND_CURRENCIES: Record<string, { exponent: number }> = {
  USD: { exponent: 2 },
};

function toMinorUnits(amount: number, currency: string): number {
  const c = SUPPORTED_REFUND_CURRENCIES[currency.toUpperCase()];
  if (!c) throw new SupplierRefusal(currency);
  return Math.round(amount * 10 ** c.exponent);
}

function toMajorString(amount: number, currency: string): string {
  const c = SUPPORTED_REFUND_CURRENCIES[currency.toUpperCase()];
  if (!c) throw new SupplierRefusal(currency);
  return amount.toFixed(c.exponent);
}

class SupplierRefusal extends Error {
  constructor(currency: string) {
    super(`Unsupported refund currency ${currency}`);
  }
}

export async function executeRefund({ paymentMethod, paymentResult, amount, orderTotal, alreadyRefunded, idempotencyKey }: RefundInput): Promise<RefundResult> {
  const method = (paymentMethod || '').toLowerCase();
  const live = process.env.REFUNDS_LIVE_ENABLED === 'true';
  const ORDER_CURRENCY = 'USD';
  if (!SUPPORTED_REFUND_CURRENCIES[ORDER_CURRENCY]) {
    return { status: 'FAILED', note: `Order currency ${ORDER_CURRENCY} is not a supported refund currency - refusing to refund.` };
  }

  // Amount validation before any provider contact: refunds must be
  // positive and the order's cumulative refunds must never exceed its
  // total.
  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: 'FAILED', note: `Invalid refund amount ${amount} - must be positive.` };
  }
  if (amount > orderTotal) {
    return { status: 'FAILED', note: `Refund ${amount} exceeds the order total ${orderTotal}.` };
  }
  if (alreadyRefunded + amount > orderTotal) {
    return { status: 'FAILED', note: `Refund ${amount} would push cumulative refunds (${alreadyRefunded} executed) past the order total ${orderTotal}.` };
  }

  if (method.includes('paypal')) {
    const captureId = paypalCaptureId(paymentResult);
    if (!captureId) return { status: 'FAILED', note: 'No PayPal capture reference on the order - cannot refund.' };
    const hasKeys = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_APP_SECRET);
    if (live && hasKeys) {
      // Currency must be derived from the original payment and match the
      // order currency - never assume. Mismatch or absence rejects before
      // any provider call.
      const ccy = paypalCurrency(paymentResult);
      if (!ccy) return { status: 'FAILED', note: 'Cannot confirm the original payment currency from the capture record - refusing to refund.' };
      if (ccy.toUpperCase() !== ORDER_CURRENCY) return { status: 'FAILED', note: `Currency mismatch: payment was ${ccy}, order currency is ${ORDER_CURRENCY} - refusing to refund.` };
    }
    if (!live || !hasKeys) {
      return { status: 'SIMULATED', note: `Refund simulated (live refunds ${live ? 'enabled but PayPal keys missing' : 'disabled - set REFUNDS_LIVE_ENABLED=true with live keys'}).` };
    }
    try {
      return await paypalRefund(captureId, amount, idempotencyKey);
    } catch (e) {
      // Network error/timeout: the request may have reached PayPal.
      // UNKNOWN, never blind-retry - reconcile with the provider first.
      return { status: 'UNKNOWN', note: `PayPal refund outcome uncertain (${e instanceof Error ? e.message : String(e)}). Do NOT retry blindly - reconcile against PayPal using idempotency key ${idempotencyKey} first.` };
    }
  }

  if (method.includes('stripe')) {
    const pr = paymentResult as { id?: string; currency?: string } | null;
    const pi = pr?.id;
    if (!pi) return { status: 'FAILED', note: 'No Stripe payment intent reference on the order - cannot refund.' };
    if (!live || !process.env.STRIPE_SECRET_KEY) {
      return { status: 'SIMULATED', note: `Refund simulated (live refunds ${live ? 'enabled but Stripe key missing' : 'disabled - set REFUNDS_LIVE_ENABLED=true with live keys'}).` };
    }
    if (!pr?.currency) return { status: 'FAILED', note: 'Cannot confirm the original payment currency - refusing to refund.' };
    if (pr.currency.toLowerCase() !== ORDER_CURRENCY.toLowerCase()) return { status: 'FAILED', note: `Currency mismatch: payment was ${pr.currency}, order currency is ${ORDER_CURRENCY} - refusing to refund.` };
    try {
      return await stripeRefund(pi, amount, idempotencyKey);
    } catch (e) {
      return { status: 'UNKNOWN', note: `Stripe refund outcome uncertain (${e instanceof Error ? e.message : String(e)}). Do NOT retry blindly - reconcile against Stripe using idempotency key ${idempotencyKey} first.` };
    }
  }

  return { status: 'FAILED', note: `Unsupported or missing payment method "${paymentMethod ?? 'none'}" - cannot refund.` };
}
