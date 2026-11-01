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
  status: 'EXECUTED' | 'SIMULATED' | 'FAILED';
  providerRef?: string;
  note: string;
};

type RefundInput = {
  paymentMethod: string | null | undefined;
  paymentResult: unknown;
  amount: number;
};

const paypalBase = () => process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

function paypalCaptureId(paymentResult: unknown): string | null {
  const pr = paymentResult as {
    id?: string;
    purchase_units?: { payments?: { captures?: { id?: string }[] } }[];
  } | null;
  return pr?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? pr?.id ?? null;
}

async function paypalRefund(captureId: string, amount: number): Promise<RefundResult> {
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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({ amount: { value: amount.toFixed(2), currency_code: 'USD' } }),
  });
  if (!res.ok) return { status: 'FAILED', note: `PayPal refund failed (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}` };
  const data = await res.json();
  return { status: 'EXECUTED', providerRef: data.id, note: `PayPal refund ${data.id} executed.` };
}

async function stripeRefund(paymentIntentId: string, amount: number): Promise<RefundResult> {
  const res = await fetch('https://api.stripe.com/v1/refunds', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      payment_intent: paymentIntentId,
      amount: String(Math.round(amount * 100)),
    }),
  });
  const data = await res.json();
  if (!res.ok) return { status: 'FAILED', note: `Stripe refund failed: ${data?.error?.message ?? `HTTP ${res.status}`}` };
  return { status: 'EXECUTED', providerRef: data.id, note: `Stripe refund ${data.id} executed.` };
}

export async function executeRefund({ paymentMethod, paymentResult, amount }: RefundInput): Promise<RefundResult> {
  const method = (paymentMethod || '').toLowerCase();
  const live = process.env.REFUNDS_LIVE_ENABLED === 'true';

  if (method.includes('paypal')) {
    const captureId = paypalCaptureId(paymentResult);
    if (!captureId) return { status: 'FAILED', note: 'No PayPal capture reference on the order - cannot refund.' };
    const hasKeys = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_APP_SECRET);
    if (!live || !hasKeys) {
      return { status: 'SIMULATED', note: `Refund simulated (live refunds ${live ? 'enabled but PayPal keys missing' : 'disabled - set REFUNDS_LIVE_ENABLED=true with live keys'}).` };
    }
    try {
      return await paypalRefund(captureId, amount);
    } catch (e) {
      return { status: 'FAILED', note: `PayPal refund error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  if (method.includes('stripe')) {
    const pi = (paymentResult as { id?: string } | null)?.id;
    if (!pi) return { status: 'FAILED', note: 'No Stripe payment intent reference on the order - cannot refund.' };
    if (!live || !process.env.STRIPE_SECRET_KEY) {
      return { status: 'SIMULATED', note: `Refund simulated (live refunds ${live ? 'enabled but Stripe key missing' : 'disabled - set REFUNDS_LIVE_ENABLED=true with live keys'}).` };
    }
    try {
      return await stripeRefund(pi, amount);
    } catch (e) {
      return { status: 'FAILED', note: `Stripe refund error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  return { status: 'FAILED', note: `Unsupported or missing payment method "${paymentMethod ?? 'none'}" - cannot refund.` };
}
