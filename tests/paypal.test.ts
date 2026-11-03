import { generateAccessToken, paypal, paypalEnvironmentForOrigin } from '../lib/paypal';

beforeEach(() => {
  global.fetch = jest.fn((url: RequestInfo | URL) => {
    const urlStr = String(url);
    if (urlStr.includes('/v1/oauth2/token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock_sandbox_access_token' }),
        text: () => Promise.resolve('{"access_token":"mock_sandbox_access_token"}'),
      } as Response);
    }
    if (urlStr.includes('/v2/checkout/orders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'mock_order_123', status: 'CREATED' }),
        text: () => Promise.resolve('{"id":"mock_order_123","status":"CREATED"}'),
      } as Response);
    }
    return Promise.reject(new Error(`Unhandled URL in test mock: ${urlStr}`));
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Test to generate access token from paypal
test('generates token from paypal', async () => {
  const tokenResponse = await generateAccessToken();
  expect(typeof tokenResponse).toBe('string');
  expect(tokenResponse).toBe('mock_sandbox_access_token');
});

// Test to create a paypal order
test('creates a paypal order', async () => {
  const price = 10.0;

  const orderResponse = await paypal.createOrder(price);

  expect(orderResponse).toHaveProperty('id', 'mock_order_123');
  expect(orderResponse).toHaveProperty('status', 'CREATED');
});

// Test to capture payment with mock order
test('simulate capturing a payment from an order', async () => {
  const orderId = '100';

  const mockCapturePayment = jest
    .spyOn(paypal, 'capturePayment')
    .mockResolvedValue({
      id: orderId,
      status: 'COMPLETED',
      payer: { email_address: 'customer@example.com' },
    });

  const captureResponse = await paypal.capturePayment(orderId);
  expect(captureResponse).toHaveProperty('status', 'COMPLETED');

  mockCapturePayment.mockRestore();
});

describe('capturePayment outcome typing', () => {
  const tokenOk = { ok: true, json: () => Promise.resolve({ access_token: 't' }), text: () => Promise.resolve('') } as Response;
  const withCapture = (capture: () => Promise<Response>) => {
    global.fetch = jest.fn((url: RequestInfo | URL) =>
      String(url).includes('/oauth2/token') ? Promise.resolve(tokenOk) : capture()
    ) as unknown as typeof fetch;
  };
  const run = async () => {
    try {
      await paypal.capturePayment('ORD');
      return null;
    } catch (e) {
      return e as { outcome?: string; detail?: string };
    }
  };
  test('network failure is UNKNOWN (money may have moved)', async () => {
    withCapture(() => Promise.reject(new Error('socket hang up')));
    expect(await run()).toMatchObject({ outcome: 'UNKNOWN', detail: 'NETWORK_OR_TIMEOUT' });
  });
  test('5xx is UNKNOWN', async () => {
    withCapture(() => Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('x') } as Response));
    expect(await run()).toMatchObject({ outcome: 'UNKNOWN', detail: 'HTTP_503' });
  });
  test('422 ORDER_ALREADY_CAPTURED is UNKNOWN to this app (it was captured)', async () => {
    withCapture(() => Promise.resolve({ ok: false, status: 422, text: () => Promise.resolve('{"details":[{"issue":"ORDER_ALREADY_CAPTURED"}]}') } as Response));
    expect(await run()).toMatchObject({ outcome: 'UNKNOWN', detail: 'ALREADY_CAPTURED' });
  });
  test('422 INSTRUMENT_DECLINED is a definite REJECTED', async () => {
    withCapture(() => Promise.resolve({ ok: false, status: 422, text: () => Promise.resolve('{"details":[{"issue":"INSTRUMENT_DECLINED"}]}') } as Response));
    expect(await run()).toMatchObject({ outcome: 'REJECTED', detail: 'HTTP_422' });
  });
  test('unreadable 200 body is UNKNOWN', async () => {
    withCapture(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) } as Response));
    expect(await run()).toMatchObject({ outcome: 'UNKNOWN', detail: 'UNREADABLE_RESPONSE' });
  });
});


test('environment provenance accepts only exact known API origins', () => {
  expect(paypalEnvironmentForOrigin('https://api-m.sandbox.paypal.com')).toBe('sandbox');
  expect(paypalEnvironmentForOrigin('https://api-m.paypal.com')).toBe('live');
  expect(paypalEnvironmentForOrigin('https://api-m.paypal.com.evil.test')).toBe('unknown');
  expect(paypalEnvironmentForOrigin('https://custom.example.test')).toBe('unknown');
});
