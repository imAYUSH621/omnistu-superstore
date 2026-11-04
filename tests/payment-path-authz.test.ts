const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockAvailable = jest.fn(() => true);
const mockAuth = jest.fn();
const mockCreatePP = jest.fn();
const mockCapture = jest.fn();
const mockUpdateToPaidInner = jest.fn();

jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      findUnique: jest.fn(),
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
    orderItem: { findMany: jest.fn(async () => [{ productId: 'p1', qty: 1, name: 'T' }]) },
    product: { findMany: jest.fn(async () => [{ id: 'p1', stock: 5 }]) },
    $transaction: (...a: unknown[]) => mockUpdateToPaidInner(...a),
  },
}));
jest.mock('@/lib/payment-capabilities', () => ({ isPaymentMethodAvailable: () => mockAvailable(), testCheckoutMode: () => false }));
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
jest.mock('@/lib/paypal', () => ({
  paypal: {
    createOrder: (...a: unknown[]) => mockCreatePP(...a),
    capturePayment: (...a: unknown[]) => mockCapture(...a),
  },
}));
jest.mock('@/lib/actions/cart.actions', () => ({ getMyCart: jest.fn() }));
jest.mock('@/lib/actions/user.actions', () => ({ getUserById: jest.fn() }));
jest.mock('@/email', () => ({ sendPurchaseReceipt: jest.fn() }));
jest.mock('@/lib/mailer', () => ({ sendOrderConfirmationEmail: jest.fn(async () => ({})) }));
jest.mock('@/lib/providers/supabase-sync', () => ({ syncOrderToSupabase: jest.fn(async () => ({})) }));
jest.mock('@/lib/fulfillment-dispatcher', () => ({ dispatchOrderFulfillment: jest.fn(async () => ({ dispatches: [] })) }));
jest.mock('@/lib/fulfillment-persistence', () => ({ persistDispatchSummary: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { createPayPalOrder, approvePayPalOrder } from '@/lib/actions/order.actions';
import { stripeMinorToAmount, isExpectedCurrency, isAmountMismatch } from '@/lib/payment-guards';

beforeEach(() => { jest.clearAllMocks(); mockAvailable.mockReturnValue(true); mockUpdateMany.mockResolvedValue({ count: 1 }); });

const OWNER = { user: { id: 'owner', role: 'user' } };
const OTHER = { user: { id: 'other', role: 'user' } };
const ADMIN = { user: { id: 'adm', role: 'admin' } };

describe('createPayPalOrder', () => {
  it('rejects an unauthenticated caller before any PayPal call', async () => {
    mockAuth.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue({ id: 'o1', userId: 'owner', paymentMethod: 'PayPal', paymentNote: null, isPaid: false, totalPrice: '10.00' });
    const r = await createPayPalOrder('o1');
    expect(r.success).toBe(false);
    expect(mockCreatePP).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it("rejects another user's order", async () => {
    mockAuth.mockResolvedValue(OTHER);
    mockFindFirst.mockResolvedValue({ id: 'o1', userId: 'owner', paymentMethod: 'PayPal', paymentNote: null, isPaid: false, totalPrice: '10.00' });
    const r = await createPayPalOrder('o1');
    expect(r.success).toBe(false);
    expect(mockCreatePP).not.toHaveBeenCalled();
  });
  it('refuses an already-paid order (would overwrite paymentResult)', async () => {
    mockAuth.mockResolvedValue(OWNER);
    mockFindFirst.mockResolvedValue({ id: 'o1', userId: 'owner', paymentMethod: 'PayPal', paymentNote: null, isPaid: true, totalPrice: '10.00' });
    const r = await createPayPalOrder('o1');
    expect(r.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it('lets the owner create the PayPal order', async () => {
    mockAuth.mockResolvedValue(OWNER);
    mockFindFirst.mockResolvedValue({ id: 'o1', userId: 'owner', paymentMethod: 'PayPal', paymentNote: null, isPaid: false, totalPrice: '10.00' });
    mockCreatePP.mockResolvedValue({ id: 'PP-1' });
    const r = await createPayPalOrder('o1');
    expect(r.success).toBe(true);
    expect(mockCreatePP).toHaveBeenCalledWith(10);
  });
});

describe('approvePayPalOrder', () => {
  const order = { id: 'o1', userId: 'owner', paymentMethod: 'PayPal', paymentNote: null, isPaid: false, paymentResult: { id: 'PP-1' } };
  it("never captures for a non-owner non-admin", async () => {
    mockAuth.mockResolvedValue(OTHER);
    mockFindFirst.mockResolvedValue(order);
    const r = await approvePayPalOrder('o1', { orderID: 'PP-1' });
    expect(r.success).toBe(false);
    expect(mockCapture).not.toHaveBeenCalled();
  });
  it('never captures when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    mockFindFirst.mockResolvedValue(order);
    const r = await approvePayPalOrder('o1', { orderID: 'PP-1' });
    expect(r.success).toBe(false);
    expect(mockCapture).not.toHaveBeenCalled();
  });
  it.each([
    ['paid', { isPaid: true }],
    ['review', { paymentNote: 'CAPTURE_UNCONFIRMED capture=PP-1' }],
    ['attempt already claimed', { paymentNote: 'CAPTURE_REQUESTED capture=PP-1' }],
    ['creation interrupted', { paymentNote: 'PAYPAL_CREATE_REQUESTED' }],
    ['wrong method', { paymentMethod: 'Stripe' }],
    ['missing binding', { paymentResult: null }],
    ['environment changed', { paymentResult: { id: 'PP-1', paypalEnv: 'live' } }],
  ])('never contacts capture for %s', async (_name, override) => {
    mockAuth.mockResolvedValue(OWNER);
    mockFindFirst.mockResolvedValue({ ...order, ...override });
    const r = await approvePayPalOrder('o1', { orderID: 'PP-1' });
    expect(r.success).toBe(false);
    expect(mockCapture).not.toHaveBeenCalled();
  });
  it('checks requested id before contacting PayPal', async () => {
    mockAuth.mockResolvedValue(OWNER); mockFindFirst.mockResolvedValue(order);
    await approvePayPalOrder('o1', { orderID: 'PP-OTHER' });
    expect(mockCapture).not.toHaveBeenCalled();
  });
  it('server master switch refuses old orders before provider calls', async () => {
    mockAuth.mockResolvedValue(OWNER); mockFindFirst.mockResolvedValue(order); mockAvailable.mockReturnValue(false);
    expect((await approvePayPalOrder('o1', { orderID: 'PP-1' })).success).toBe(false);
    expect((await createPayPalOrder('o1')).success).toBe(false);
    expect(mockCapture).not.toHaveBeenCalled(); expect(mockCreatePP).not.toHaveBeenCalled();
  });
  it('failed durable claim means no capture', async () => {
    mockAuth.mockResolvedValue(OWNER); mockFindFirst.mockResolvedValue(order); mockUpdateMany.mockResolvedValue({ count: 0 });
    expect((await approvePayPalOrder('o1', { orderID: 'PP-1' })).success).toBe(false);
    expect(mockCapture).not.toHaveBeenCalled();
  });
  it('unavailable claim database never contacts capture', async () => {
    mockAuth.mockResolvedValue(OWNER); mockFindFirst.mockResolvedValue(order);
    mockUpdateMany.mockRejectedValueOnce(new Error('database unavailable'));
    expect((await approvePayPalOrder('o1', { orderID: 'PP-1' })).success).toBe(false);
    expect(mockCapture).not.toHaveBeenCalled();
  });
  it('rejects a capture in a non-USD currency and records a note, without marking paid', async () => {
    mockAuth.mockResolvedValue(ADMIN);
    mockFindFirst.mockResolvedValue(order);
    mockCapture.mockResolvedValue({
      id: 'PP-1', status: 'COMPLETED', payer: { email_address: 'a@b.co' },
      purchase_units: [{ payments: { captures: [{ status: 'COMPLETED', amount: { value: '10.00', currency_code: 'EUR' } }] } }],
    });
    const r = await approvePayPalOrder('o1', { orderID: 'PP-1' });
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/currency/i);
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { paymentNote: expect.stringContaining('CURRENCY_MISMATCH') } }));
    expect(mockUpdateToPaidInner).not.toHaveBeenCalled();
  });
  const cap = (captures: unknown[], id = 'PP-1') => ({ id, status: 'COMPLETED', payer: { email_address: 'a@b.co' }, purchase_units: [{ payments: { captures } }] });
  it.each([
    ['no capture object', [] as unknown[]],
    ['capture not COMPLETED', [{ status: 'PENDING', amount: { value: '10.00', currency_code: 'USD' } }]],
    ['capture without amount', [{ status: 'COMPLETED', amount: { currency_code: 'USD' } }]],
    ['capture with empty amount', [{ status: 'COMPLETED', amount: { value: '', currency_code: 'USD' } }]],
  ])('fails closed and does not mark paid: %s', async (_n, captures) => {
    mockAuth.mockResolvedValue(ADMIN);
    mockFindFirst.mockResolvedValue(order);
    mockCapture.mockResolvedValue(cap(captures));
    const r = await approvePayPalOrder('o1', { orderID: 'PP-1' });
    expect(r.success).toBe(false);
    expect(mockUpdateToPaidInner).not.toHaveBeenCalled();
  });
  it('rejects a capture whose PayPal order id differs from the one bound at create time', async () => {
    mockAuth.mockResolvedValue(ADMIN);
    mockFindFirst.mockResolvedValue(order);
    mockCapture.mockResolvedValue(cap([{ status: 'COMPLETED', amount: { value: '10.00', currency_code: 'USD' } }], 'PP-OTHER'));
    const r = await approvePayPalOrder('o1', { orderID: 'PP-1' });
    expect(r.success).toBe(false);
    expect(mockUpdateToPaidInner).not.toHaveBeenCalled();
  });
});

describe('payment guards', () => {
  it('keeps cents when converting Stripe minor units (toFixed() would round 42.50 up)', () => {
    expect(stripeMinorToAmount(4250)).toBe('42.50');
    expect(stripeMinorToAmount(1999)).toBe('19.99');
    expect((4250 / 100).toFixed()).toBe('43'); // the old behaviour, now pinned as the bug
  });
  it('old rounding would have flagged a legitimate 42.50 charge as a mismatch; new does not', () => {
    expect(isAmountMismatch((4250 / 100).toFixed(), 42.5)).toBe(true);
    expect(isAmountMismatch(stripeMinorToAmount(4250), 42.5)).toBe(false);
  });
  it('currency check is case-insensitive and rejects missing/other', () => {
    expect(isExpectedCurrency('usd')).toBe(true);
    expect(isExpectedCurrency('USD')).toBe(true);
    expect(isExpectedCurrency('EUR')).toBe(false);
    expect(isExpectedCurrency(undefined)).toBe(false);
  });
  it('Stripe negative scenarios: negative, NaN and fractional minor units never match a real total', () => {
    expect(stripeMinorToAmount(-4250)).toBe('-42.50');
    expect(isAmountMismatch(stripeMinorToAmount(-4250), 42.5)).toBe(true);
    expect(isAmountMismatch(stripeMinorToAmount(NaN), 42.5)).toBe(true);
    expect(isAmountMismatch(stripeMinorToAmount(0), 42.5)).toBe(true);
    expect(isAmountMismatch(stripeMinorToAmount(4249), 42.5)).toBe(true); // exact minor units, no tolerance
    expect(isAmountMismatch(stripeMinorToAmount(4300), 42.5)).toBe(true);
  });
});
