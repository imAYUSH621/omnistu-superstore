const mockAuth = jest.fn();
const mockFindMany = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
jest.mock('@/db/prisma', () => ({ prisma: { product: { findMany: (...a: unknown[]) => mockFindMany(...a) } } }));
jest.mock('@/lib/paid-reconciliation', () => ({ findPaidOrdersNeedingAttention: jest.fn() }));

import { getOversoldProducts } from '@/lib/actions/reconcile.actions';

beforeEach(() => {
  mockAuth.mockReset();
  mockFindMany.mockReset();
});

describe('getOversoldProducts (read-only, admin only)', () => {
  it('denies guests and non-admins without querying', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await getOversoldProducts()).success).toBe(false);
    mockAuth.mockResolvedValue({ user: { role: 'user' } });
    expect((await getOversoldProducts()).success).toBe(false);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
  it('admin gets only products with stock below zero', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } });
    mockFindMany.mockResolvedValue([{ slug: 'a-a-a', name: 'A', stock: -2 }]);
    const r = await getOversoldProducts();
    expect(r.success && r.items).toHaveLength(1);
    expect((mockFindMany.mock.calls[0][0] as { where: unknown }).where).toEqual({ stock: { lt: 0 } });
  });
  it('a database error is reported, not an empty success', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } });
    mockFindMany.mockRejectedValue(new Error('down'));
    expect((await getOversoldProducts()).success).toBe(false);
  });
});
