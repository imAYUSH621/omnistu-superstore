/**
 * Race / failure / retry fixtures for order placement, payment capture and
 * dispatch persistence (D11, D12, D4) - beyond happy-path unit greens.
 */

const mockOrderFindUnique = jest.fn();
const mockOrderFindFirst = jest.fn();
const mockOrderUpdate = jest.fn();
const mockOrderUpdateMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findUnique: (...a: unknown[]) => mockOrderFindUnique(...a),
      findFirst: (...a: unknown[]) => mockOrderFindFirst(...a),
      update: (...a: unknown[]) => mockOrderUpdate(...a),
      updateMany: (...a: unknown[]) => mockOrderUpdateMany(...a),
    },
    product: { findMany: jest.fn(async () => [{ id: 'p1', stock: 5 }]) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));
jest.mock('@/auth', () => ({
  auth: jest.fn(async () => ({ user: { id: 'user-1' } })),
}));
jest.mock('@/lib/actions/cart.actions', () => ({
  getMyCart: jest.fn(async () => ({
    id: 'cart-1',
    items: [{ productId: 'p1', qty: 1, price: '42.00', name: 'Thing', slug: 'thing', image: '/i.jpg' }],
    itemsPrice: '42.00',
    shippingPrice: '0.00',
    taxPrice: '0.00',
    totalPrice: '42.00',
  })),
}));
jest.mock('@/lib/actions/user.actions', () => ({
  getUserById: jest.fn(async () => ({
    id: 'user-1',
    address: { fullName: 'Test User', streetAddress: '1 Main St', city: 'Patna', postalCode: '800001', country: 'India' },
    paymentMethod: 'PayPal',
  })),
}));
jest.mock('@/lib/payment-capabilities', () => ({ isPaymentMethodAvailable: () => true, testCheckoutMode: () => false }));
jest.mock('@/email', () => ({ sendPurchaseReceipt: jest.fn() }));
jest.mock('@/lib/mailer', () => ({ sendOrderConfirmationEmail: jest.fn(async () => ({})) }));
jest.mock('@/lib/providers/supabase-sync', () => ({ syncOrderToSupabase: jest.fn(async () => ({})) }));
jest.mock('@/lib/fulfillment-dispatcher', () => ({
  dispatchOrderFulfillment: jest.fn(async () => ({ dispatches: [] })),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { createOrder } from '@/lib/actions/order.actions';
import { updateOrderToPaid } from '@/lib/order-settlement';
import { aggregateDispatchStatus, persistDispatchSummary } from '@/lib/fulfillment-persistence';

const CART_REDIRECT = /\/order\//;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createOrder idempotency (D11)', () => {
  it('a retried submit with the same key returns the original order, no second create', async () => {
    mockOrderFindUnique.mockResolvedValueOnce({ id: 'order-original' });
    const res = await createOrder('key-123');
    expect(res.success).toBe(true);
    expect(res.redirectTo).toBe('/order/order-original');
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('a lost P2002 race returns the winner order instead of an error', async () => {
    mockOrderFindUnique
      .mockResolvedValueOnce(null) // pre-check: no order yet
      .mockResolvedValueOnce({ id: 'order-winner' }); // after race loss
    mockTransaction.mockRejectedValueOnce({ code: 'P2002' });
    const res = await createOrder('key-123');
    expect(res.success).toBe(true);
    expect(res.redirectTo).toBe('/order/order-winner');
  });

  it('a P2002 race with no discoverable order surfaces an error, not a fake success', async () => {
    mockOrderFindUnique.mockResolvedValue(null);
    mockTransaction.mockRejectedValueOnce({ code: 'P2002' });
    const res = await createOrder('key-123');
    expect(res.success).toBe(false);
  });

  it('keyless double-submit within 30s with identical items dedupes', async () => {
    mockOrderFindFirst.mockResolvedValueOnce({
      id: 'order-recent',
      orderitems: [{ productId: 'p1', qty: 1 }],
    });
    const res = await createOrder();
    expect(res.success).toBe(true);
    expect(res.redirectTo).toBe('/order/order-recent');
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe('updateOrderToPaid amount guard (D12)', () => {
  const baseOrder = {
    id: 'order-1',
    totalPrice: '42.00',
    isPaid: false,
    orderitems: [{ productId: 'p1', qty: 1 }],
  };

  it('mismatched capture records AMOUNT_MISMATCH and never marks paid', async () => {
    mockOrderFindFirst.mockResolvedValueOnce(baseOrder);
    await expect(
      updateOrderToPaid({
        orderId: 'order-1',
        paymentResult: { id: 'cap-1', status: 'COMPLETED', pricePaid: '4.20', email_address: 'x@y.z' },
      })
    ).rejects.toThrow('Captured amount does not match');
    expect(mockOrderUpdateMany).toHaveBeenCalledTimes(1);
    const updateArg = mockOrderUpdateMany.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: 'order-1', isPaid: false });
    expect(updateArg.data.paymentNote).toMatch(/^AMOUNT_MISMATCH/);
    expect(updateArg.data.paymentResult.status).toBe('AMOUNT_MISMATCH');
    expect(updateArg.data.isPaid).toBeUndefined();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('a retry with the correct amount after a mismatch pays exactly once', async () => {
    mockOrderFindFirst
      .mockResolvedValueOnce(baseOrder) // guard read
      .mockResolvedValueOnce({ ...baseOrder, isPaid: true, orderitems: [], user: null }); // post-tx read
    mockTransaction.mockImplementationOnce(async (cb: any) =>
      cb({ product: { update: jest.fn() }, order: { updateMany: jest.fn(async () => ({ count: 1 })) } })
    );
    const res = await updateOrderToPaid({
      orderId: 'order-1',
      paymentResult: { id: 'cap-2', status: 'COMPLETED', pricePaid: '42.00', email_address: 'x@y.z' },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('an already-paid order rejects a second capture (no double stock decrement)', async () => {
    mockOrderFindFirst.mockResolvedValueOnce({ ...baseOrder, isPaid: true });
    await expect(
      updateOrderToPaid({
        orderId: 'order-1',
        paymentResult: { id: 'cap-3', status: 'COMPLETED', pricePaid: '42.00', email_address: 'x@y.z' },
      })
    ).rejects.toThrow('already paid');
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe('dispatch persistence failure/retry (D4)', () => {
  it('records failures with dispatchedAt null and a readable dispatchError', async () => {
    await persistDispatchSummary('order-1', {
      dispatches: [
        { supplier: 'CJ', status: 'BLOCKED_ADDRESS', message: 'missing city', supplierOrderId: null, trackingNumber: null, carrier: null },
        { supplier: 'PRINTIFY', status: 'SIMULATED', message: 'no API key configured', supplierOrderId: null, trackingNumber: null, carrier: null },
      ],
    } as any);
    const arg = mockOrderUpdate.mock.calls[0][0];
    expect(arg.data.dispatchedAt).toBeNull();
    expect(arg.data.dispatchError).toMatch(/CJ: missing city/);
    expect(arg.data.dispatchError).toMatch(/PRINTIFY: no API key/);
    expect(arg.data.dispatchStatus).toBe('BLOCKED_ADDRESS+SIMULATED');
  });

  it('a later successful retry overwrites the failure state cleanly', async () => {
    await persistDispatchSummary('order-1', {
      dispatches: [
        { supplier: 'CJ', status: 'DISPATCHED', message: 'ok', supplierOrderId: 'cj-9', trackingNumber: null, carrier: null },
      ],
    } as any);
    const arg = mockOrderUpdate.mock.calls[0][0];
    expect(arg.data.dispatchStatus).toBe('DISPATCHED');
    expect(arg.data.supplierOrderId).toBe('cj-9');
    expect(arg.data.dispatchError).toBeNull();
    expect(arg.data.dispatchedAt).toBeInstanceOf(Date);
  });

  it('aggregateDispatchStatus never collapses mixed failures into DISPATCHED', () => {
    expect(aggregateDispatchStatus([
      { supplier: 'CJ', status: 'DISPATCHED', message: '', supplierOrderId: null, trackingNumber: null, carrier: null },
      { supplier: 'PRINTIFY', status: 'FAILED', message: '', supplierOrderId: null, trackingNumber: null, carrier: null },
    ] as any)).toBe('PARTIAL');
  });
});
