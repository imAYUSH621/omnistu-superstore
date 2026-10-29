import { generateAccessToken, paypal } from '../lib/paypal';

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
