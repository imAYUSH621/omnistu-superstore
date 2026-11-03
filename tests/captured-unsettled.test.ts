import { describe, expect, test } from '@jest/globals';

const mockUpdateMany = jest.fn();
const mockFindFirst = jest.fn();
jest.mock('@/db/prisma', () => ({ prisma: { order: { findFirst: (...a: unknown[]) => mockFindFirst(...a), updateMany: (...a: unknown[]) => mockUpdateMany(...a) } } }));

import { recordCapturedUnsettled } from '@/lib/captured-unsettled';

describe('recordCapturedUnsettled', () => {
  test('writes a CAPTURED_UNSETTLED note only on an unpaid order without an existing note', async () => {
    mockFindFirst.mockResolvedValue({ paymentNote: null });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    await recordCapturedUnsettled('o1', 'CAP1', '64.23', new Error('connection refused at db.internal:5432 password=hunter2'));
    const arg = mockUpdateMany.mock.calls[0][0] as { where: Record<string, unknown>; data: { paymentNote: string } };
    expect(arg.where).toMatchObject({ id: 'o1', isPaid: false });
    expect(JSON.stringify(arg.where)).toContain('OR');
    expect(arg.data.paymentNote).toContain('CAPTURED_UNSETTLED');
    expect(arg.data.paymentNote).toContain('CAP1');
    expect(arg.data.paymentNote).toContain('reason=UNKNOWN');
    expect(arg.data.paymentNote).not.toContain('hunter2');
    expect(arg.data.paymentNote).not.toContain('db.internal');
  });
  test('typed ALREADY_PAID on a really-paid order writes nothing (scoped to unpaid rows)', async () => {
    mockUpdateMany.mockClear();
    mockFindFirst.mockResolvedValue(null); // no unpaid row: the DB shows it paid
    const e = Object.assign(new Error('Order is already paid'), { settlementCode: 'ALREADY_PAID' });
    await recordCapturedUnsettled('o1', 'CAP1', '64.23', e);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
  test('"already paid" text inside a database error is NOT treated as the benign race', async () => {
    mockFindFirst.mockResolvedValue({ paymentNote: null });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    const e = Object.assign(new Error("Invalid `tx.product.update()` ... throw new Error('Order is already paid')"), { name: 'PrismaClientKnownRequestError' });
    await recordCapturedUnsettled('o2', 'CAP2', '1.00', e);
    const arg = mockUpdateMany.mock.calls.at(-1)?.[0] as { data: { paymentNote: string } };
    expect(arg.data.paymentNote).toContain('reason=DB_ERROR');
  });
  test('never throws when the note write itself fails', async () => {
    mockFindFirst.mockResolvedValue({ paymentNote: null });
    mockUpdateMany.mockRejectedValue(new Error('db down'));
    await expect(recordCapturedUnsettled('o1', 'CAP1', '1.00', new Error('x'))).resolves.toBeUndefined();
  });
});
