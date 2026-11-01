import { executeRefund } from '@/lib/refunds';

const CAPTURE_PR = { id: 'ORDER123', purchase_units: [{ payments: { captures: [{ id: 'CAPTURE456' }] } }] };

describe('executeRefund fail-closed behavior (G3)', () => {
  const env = process.env;
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    delete process.env.REFUNDS_LIVE_ENABLED;
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_APP_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => {
    process.env = env;
    fetchMock.mockRestore();
  });

  it('SIMULATED without keys and never calls any provider', async () => {
    const r = await executeRefund({ paymentMethod: 'PayPal', paymentResult: CAPTURE_PR, amount: 25 });
    expect(r.status).toBe('SIMULATED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('SIMULATED when flag set but keys missing', async () => {
    process.env.REFUNDS_LIVE_ENABLED = 'true';
    const r = await executeRefund({ paymentMethod: 'PayPal', paymentResult: CAPTURE_PR, amount: 25 });
    expect(r.status).toBe('SIMULATED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('EXECUTED with flag + keys: calls capture refund endpoint with exact amount', async () => {
    process.env.REFUNDS_LIVE_ENABLED = 'true';
    process.env.PAYPAL_CLIENT_ID = 'id';
    process.env.PAYPAL_APP_SECRET = 'secret';
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'REFUND789' }) } as Response);
    const r = await executeRefund({ paymentMethod: 'PayPal', paymentResult: CAPTURE_PR, amount: 25 });
    expect(r.status).toBe('EXECUTED');
    expect(r.providerRef).toBe('REFUND789');
    const refundCall = fetchMock.mock.calls[1];
    expect(refundCall[0]).toContain('/v2/payments/captures/CAPTURE456/refund');
    expect(JSON.parse(refundCall[1].body).amount.value).toBe('25.00');
  });

  it('FAILED on provider error, records reason, claims nothing moved', async () => {
    process.env.REFUNDS_LIVE_ENABLED = 'true';
    process.env.PAYPAL_CLIENT_ID = 'id';
    process.env.PAYPAL_APP_SECRET = 'secret';
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 422, text: async () => 'UNPROCESSABLE' } as Response);
    const r = await executeRefund({ paymentMethod: 'PayPal', paymentResult: CAPTURE_PR, amount: 25 });
    expect(r.status).toBe('FAILED');
    expect(r.note).toContain('422');
  });

  it('FAILED when the order has no provider reference', async () => {
    process.env.REFUNDS_LIVE_ENABLED = 'true';
    process.env.PAYPAL_CLIENT_ID = 'id';
    process.env.PAYPAL_APP_SECRET = 'secret';
    const r = await executeRefund({ paymentMethod: 'PayPal', paymentResult: null, amount: 25 });
    expect(r.status).toBe('FAILED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Stripe path: cents conversion and payment_intent passed; SIMULATED without key', async () => {
    const sim = await executeRefund({ paymentMethod: 'Stripe', paymentResult: { id: 'pi_1' }, amount: 19.99 });
    expect(sim.status).toBe('SIMULATED');
    process.env.REFUNDS_LIVE_ENABLED = 'true';
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 're_1' }) } as Response);
    const r = await executeRefund({ paymentMethod: 'Stripe', paymentResult: { id: 'pi_1' }, amount: 19.99 });
    expect(r.status).toBe('EXECUTED');
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('payment_intent')).toBe('pi_1');
    expect(body.get('amount')).toBe('1999');
  });

  it('FAILED for unknown payment method, no provider call', async () => {
    const r = await executeRefund({ paymentMethod: 'CashOnDelivery', paymentResult: {}, amount: 10 });
    expect(r.status).toBe('FAILED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
