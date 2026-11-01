/**
 * Return/RMA flow (G3) - simulation-only guarantees.
 */

const mockOrderFindUnique = jest.fn();
const mockReturnFindFirst = jest.fn();
const mockReturnFindUnique = jest.fn();
const mockReturnCreate = jest.fn();
const mockReturnUpdate = jest.fn();
const mockReturnFindMany = jest.fn();
const mockReturnUpdateMany = jest.fn();
const mockAuth = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock('@/db/prisma', () => {
  const tx = {
    $queryRaw: (...a: unknown[]) => mockQueryRaw(...a),
    $executeRaw: (...a: unknown[]) => mockQueryRaw(...a),
    returnRequest: {
      findFirst: (...a: unknown[]) => mockReturnFindFirst(...a),
      findUnique: (...a: unknown[]) => mockReturnFindUnique(...a),
      create: (...a: unknown[]) => mockReturnCreate(...a),
      update: (...a: unknown[]) => mockReturnUpdate(...a),
      updateMany: (...a: unknown[]) => mockReturnUpdateMany(...a),
      findMany: (...a: unknown[]) => mockReturnFindMany(...a),
    },
  };
  return {
    prisma: {
      order: { findUnique: (...a: unknown[]) => mockOrderFindUnique(...a) },
      returnRequest: tx.returnRequest,
      $queryRaw: (...a: unknown[]) => mockQueryRaw(...a),
      $executeRaw: (...a: unknown[]) => mockQueryRaw(...a),
      // run the interactive-transaction callback against the same mocked
      // delegates; the advisory lock is a no-op in unit tests
      $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
    },
  };
});
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));

import { requestReturn, reviewReturn } from '@/lib/actions/return.actions';

const paidOrder = {
  id: 'order-1',
  userId: 'user-1',
  isPaid: true,
  totalPrice: '42.00',
  dispatchSupplier: null,
  paymentMethod: 'PayPal',
  paymentResult: { id: 'ORDER1', purchase_units: [{ payments: { captures: [{ id: 'CAP1' }] } }] },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryRaw.mockResolvedValue(undefined);
  mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
  // default: the atomic REQUESTED -> PROCESSING claim succeeds, and no
  // refunds were executed on this order before
  mockReturnUpdateMany.mockResolvedValue({ count: 1 });
  mockReturnFindMany.mockResolvedValue([]);
});

describe('requestReturn', () => {
  test('requires sign-in', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await requestReturn('order-1', 'Item arrived damaged and unusable');
    expect(res.success).toBe(false);
  });

  test('rejects unpaid orders and foreign orders', async () => {
    mockOrderFindUnique.mockResolvedValueOnce({ ...paidOrder, isPaid: false });
    expect((await requestReturn('order-1', 'Item arrived damaged and unusable')).success).toBe(false);
    mockOrderFindUnique.mockResolvedValueOnce({ ...paidOrder, userId: 'someone-else' });
    expect((await requestReturn('order-1', 'Item arrived damaged and unusable')).success).toBe(false);
  });

  test('blocks a new return while one is stuck PROCESSING (mid-refund)', async () => {
    mockOrderFindUnique.mockResolvedValueOnce(paidOrder);
    mockReturnFindFirst.mockResolvedValueOnce({ id: 'rr-stuck', status: 'PROCESSING' });
    const res = await requestReturn('order-1', 'Item arrived damaged and unusable');
    expect(res.success).toBe(false);
    expect(mockReturnFindFirst).toHaveBeenCalledWith({
      where: { orderId: 'order-1', status: { in: ['REQUESTED', 'PROCESSING', 'APPROVED'] } },
    });
  });

  test('rejects duplicate open requests', async () => {
    mockOrderFindUnique.mockResolvedValueOnce(paidOrder);
    mockReturnFindFirst.mockResolvedValueOnce({ id: 'rr-1', status: 'REQUESTED' });
    const res = await requestReturn('order-1', 'Item arrived damaged and unusable');
    expect(res.success).toBe(false);
    expect(res.returnId).toBe('rr-1');
  });

  test('creates a REQUESTED record for an owned paid order', async () => {
    mockOrderFindUnique.mockResolvedValueOnce(paidOrder);
    mockReturnFindFirst.mockResolvedValueOnce(null);
    mockReturnCreate.mockResolvedValueOnce({ id: 'rr-2' });
    const res = await requestReturn('order-1', 'Item arrived damaged and unusable');
    expect(res.success).toBe(true);
    expect(mockReturnCreate).toHaveBeenCalledWith({
      data: { orderId: 'order-1', userId: 'user-1', reason: 'Item arrived damaged and unusable' },
    });
  });
});

describe('reviewReturn (admin)', () => {
  const requested = { id: 'rr-1', status: 'REQUESTED', order: paidOrder };

  test('non-admin cannot review', async () => {
    const res = await reviewReturn('rr-1', true);
    expect(res.success).toBe(false);
  });

  test('admin approval records SIMULATED refund - never a provider call', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockReturnFindUnique.mockResolvedValueOnce(requested);
    const res = await reviewReturn('rr-1', true);
    expect(res.success).toBe(true);
    const update = mockReturnUpdate.mock.calls[0][0];
    expect(update.data.status).toBe('APPROVED');
    expect(update.data.refundStatus).toBe('SIMULATED');
    expect(update.data.resolutionNote).toMatch(/refund simulated/i);
    expect(update.data.supplierReturnStatus).toBe('NOT_REQUIRED');
  });

  test('supplier-dispatched orders get PENDING_MANUAL supplier-return status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockReturnFindUnique.mockResolvedValueOnce({
      ...requested,
      order: { ...paidOrder, dispatchSupplier: 'CJ' },
    });
    const res = await reviewReturn('rr-1', true);
    expect(res.success).toBe(true);
    const update = mockReturnUpdate.mock.calls[0][0];
    expect(update.data.supplierReturnStatus).toBe('PENDING_MANUAL');
    expect(update.data.resolutionNote).toMatch(/manually/);
  });

  test('rejection records note; already-resolved requests cannot be re-reviewed', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockReturnFindUnique.mockResolvedValueOnce(requested);
    const res = await reviewReturn('rr-1', false, 'Outside policy window');
    expect(res.success).toBe(true);
    expect(mockReturnUpdate.mock.calls[0][0].data.status).toBe('REJECTED');

    mockReturnFindUnique.mockResolvedValueOnce({ ...requested, status: 'APPROVED' });
    expect((await reviewReturn('rr-1', true)).success).toBe(false);
  });
});

describe('getAllReturns admin listing', () => {
  it('rejects non-admin callers', async () => {
    const { getAllReturns } = await import('@/lib/actions/return.actions');
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1', role: 'user' } });
    const res = await getAllReturns();
    expect(res.success).toBe(false);
    expect(mockReturnFindMany).not.toHaveBeenCalled();
  });
  it('returns serialized rows for admins', async () => {
    const { getAllReturns } = await import('@/lib/actions/return.actions');
    mockAuth.mockResolvedValueOnce({ user: { id: 'a1', role: 'admin' } });
    mockReturnFindMany.mockResolvedValueOnce([{ id: 'r1', status: 'REQUESTED' }]);
    const res = await getAllReturns();
    expect(res.success).toBe(true);
    expect(res.data).toEqual([{ id: 'r1', status: 'REQUESTED' }]);
  });
});

describe('admin returns page (source scan)', () => {
  const src = require('fs').readFileSync('app/admin/returns/page.tsx', 'utf8');
  it('is admin-guarded and labels refunds as simulated', () => {
    expect(src).toMatch(/requireAdmin/);
    expect(src).toMatch(/SIMULATED/);
    expect(src).not.toMatch(/processRefund|stripe\.refunds|paypal.*refund/i);
  });
});

describe('reviewReturn concurrency and cumulative guards (G3 hardening)', () => {
  it('rejects a second concurrent approval when the atomic claim fails', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockReturnFindUnique.mockResolvedValueOnce({ id: 'rr-1', status: 'REQUESTED', orderId: 'order-1', order: paidOrder });
    mockReturnUpdateMany.mockResolvedValueOnce({ count: 0 });
    const res = await reviewReturn('rr-1', true);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/already being processed/i);
    expect(mockReturnUpdate).not.toHaveBeenCalled();
  });

  it('passes prior EXECUTED refunds into the cumulative cap check', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockReturnFindUnique.mockResolvedValueOnce({ id: 'rr-1', status: 'REQUESTED', orderId: 'order-1', order: paidOrder });
    mockReturnFindMany.mockResolvedValueOnce([{ refundAmount: '42.00' }]);
    const res = await reviewReturn('rr-1', true);
    // already refunded the full total -> cumulative cap FAILS the refund
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/cumulative/i);
    expect(mockReturnUpdateMany).toHaveBeenCalledWith({
      where: { id: 'rr-1', status: 'REQUESTED' },
      data: { status: 'PROCESSING' },
    });
  });
});
