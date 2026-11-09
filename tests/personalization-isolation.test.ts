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
  it.each([{page:-1,limit:-5},{page:NaN,limit:Infinity},{page:1.5,limit:0},{page:10001,limit:999999}])('bounds direct callable arguments %p before database use',async args=>{mockAuth.mockResolvedValue({user:{id:'self'}});await getMyOrders(args);expect(mockOrderFindMany).toHaveBeenCalledWith({where:{userId:'self'},orderBy:[{createdAt:'desc'},{id:'desc'}],take:12,skip:0})});
  it('retains bounded home limit and deterministic equal-date ordering',async()=>{mockAuth.mockResolvedValue({user:{id:'self'}});await getMyOrders({page:2,limit:3});expect(mockOrderFindMany).toHaveBeenCalledWith({where:{userId:'self'},orderBy:[{createdAt:'desc'},{id:'desc'}],take:3,skip:3})});

});
