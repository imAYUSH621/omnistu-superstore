/**
 * Personalization data isolation: getMyOrders must derive ONLY from the
 * authenticated session user - no cross-user leakage, no anonymous access.
 */

const mockOrderFindMany = jest.fn();
const mockOrderCount = jest.fn();
const mockAuth = jest.fn();

jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findMany: (...a: unknown[]) => mockOrderFindMany(...a),
      count: (...a: unknown[]) => mockOrderCount(...a),
    },
  },
}));
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));

import { getMyOrders } from '@/lib/actions/order.actions';

describe('personalization cross-user isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderFindMany.mockResolvedValue([]);
    mockOrderCount.mockResolvedValue(0);
  });

  it('queries orders filtered by the SESSION user id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-alice' } });
    await getMyOrders({ limit: 3, page: 1 });
    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-alice' } })
    );
    expect(mockOrderCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-alice' } })
    );
  });

  it('a different session sees a different filter - never a shared or missing one', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-bob' } });
    await getMyOrders({ limit: 3, page: 1 });
    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-bob' } })
    );
    const calls = mockOrderFindMany.mock.calls.map((c) => JSON.stringify(c[0]));
    expect(calls.every((c) => !c.includes('user-alice'))).toBe(true);
  });

  it('anonymous access is rejected outright', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getMyOrders({ limit: 3, page: 1 })).rejects.toThrow('User is not authorized');
    expect(mockOrderFindMany).not.toHaveBeenCalled();
  });

  it('session without a user id is rejected - never an unfiltered query', async () => {
    // Prisma ignores undefined where values, which would expose ALL
    // orders; the action must reject before querying instead.
    mockAuth.mockResolvedValue({ user: {} });
    await expect(getMyOrders({ limit: 3, page: 1 })).rejects.toThrow('User is not authorized');
    expect(mockOrderFindMany).not.toHaveBeenCalled();
  });
});
