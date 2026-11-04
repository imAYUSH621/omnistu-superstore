import { describe, expect, test } from '@jest/globals';

const mockAuth = jest.fn();
const mockFindMany = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
jest.mock('@/db/prisma', () => ({ prisma: { order: { findMany: (...a: unknown[]) => mockFindMany(...a) } } }));

import { getUnsettledCaptures } from '@/lib/actions/reconcile.actions';

describe('getUnsettledCaptures', () => {
  test('rejects non-admin and anonymous callers without querying', async () => {
    mockAuth.mockResolvedValueOnce({ user: { role: 'user' } });
    expect((await getUnsettledCaptures()).success).toBe(false);
    mockAuth.mockResolvedValueOnce(null);
    expect((await getUnsettledCaptures()).success).toBe(false);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
  test('admin: queries unpaid orders for all four incident/unsettled prefixes, read-only', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } });
    mockFindMany.mockResolvedValue([{ id: 'o1', createdAt: new Date('2026-11-03T10:00:00Z'), paymentNote: 'CAPTURED_UNSETTLED reason=DB_ERROR capture=C1 amount=1.00' }]);
    const r = await getUnsettledCaptures();
    expect(r.success).toBe(true);
    const arg = mockFindMany.mock.calls[0][0] as { where: { isPaid: boolean; OR: { paymentNote: { contains: string } }[] } };
    expect(arg.where.isPaid).toBe(false);
    expect(arg.where.OR.map((c) => c.paymentNote.contains).sort()).toEqual(['AMOUNT_MISMATCH', 'CAPTURED_UNSETTLED', 'CAPTURE_PENDING', 'CAPTURE_REQUESTED', 'CAPTURE_UNCONFIRMED', 'CURRENCY_MISMATCH', 'PAYPAL_CREATE_REQUESTED', 'STRIPE_SETTLEMENT_REQUESTED']);
  });
  test('db failure returns a generic message', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } });
    mockFindMany.mockRejectedValue(new Error('password=hunter2'));
    const r = await getUnsettledCaptures();
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).not.toContain('hunter2');
  });
});
