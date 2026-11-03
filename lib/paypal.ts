const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

// The environment is captured from the same immutable origin used for this API instance.
// Unknown/custom origins stay unknown; never infer legacy payment provenance from today's env.
export function paypalEnvironmentForOrigin(origin: string): 'sandbox' | 'live' | 'unknown' {
  if (origin === 'https://api-m.sandbox.paypal.com') return 'sandbox';
  if (origin === 'https://api-m.paypal.com') return 'live';
  return 'unknown';
}
export const paypal = {
  environment: paypalEnvironmentForOrigin(base),
  createOrder: async function createOrder(price: number) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: price,
            },
          },
        ],
      }),
    });

    return handleResponse(response);
  },
  capturePayment: async function capturePayment(orderId: string) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderId}/capture`;

    // Once the capture request is sent, any failure to read the answer leaves the money state UNKNOWN
    // (PayPal may have captured). Typed outcomes let the caller tell "definitely not captured" from
    // "unknown" without matching message text.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });
    } catch {
      throw new CaptureOutcomeError('UNKNOWN', 'NETWORK_OR_TIMEOUT');
    } finally {
      clearTimeout(timer);
    }
    if (response.ok) {
      try {
        return await response.json();
      } catch {
        throw new CaptureOutcomeError('UNKNOWN', 'UNREADABLE_RESPONSE');
      }
    }
    const status = response.status;
    const text = await response.text().catch(() => '');
    // 5xx: PayPal may or may not have captured. 422 ORDER_ALREADY_CAPTURED: it WAS captured earlier.
    if (status >= 500 || status === 408 || status === 429) throw new CaptureOutcomeError('UNKNOWN', `HTTP_${status}`);
    if (status === 422 && text.includes('ORDER_ALREADY_CAPTURED')) throw new CaptureOutcomeError('UNKNOWN', 'ALREADY_CAPTURED');
    throw new CaptureOutcomeError('REJECTED', `HTTP_${status}`);
  },
};

/** `UNKNOWN`: money may have been captured. `REJECTED`: PayPal definitively refused the capture. */
export class CaptureOutcomeError extends Error {
  outcome: 'UNKNOWN' | 'REJECTED';
  detail: string;
  constructor(outcome: 'UNKNOWN' | 'REJECTED', detail: string) {
    super(`PayPal capture ${outcome}: ${detail}`);
    this.name = 'CaptureOutcomeError';
    this.outcome = outcome;
    this.detail = detail;
  }
}

// Generate paypal access token
async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString(
    'base64'
  );

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const jsonData = await handleResponse(response);
  return jsonData.access_token;
}

async function handleResponse(response: Response) {
  if (response.ok) {
    return response.json();
  } else {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

export { generateAccessToken };
