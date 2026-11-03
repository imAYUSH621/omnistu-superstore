import { describe, expect, test } from '@jest/globals';

const mockUpdateMany = jest.fn();
jest.mock('@/db/prisma', () => ({ prisma: { order: { updateMany: (...a: unknown[]) => mockUpdateMany(...a) } } }));

import { recordCapturedUnsettled } from '@/lib/captured-unsettled';

describe('recordCapturedUnsettled', () => {
  test('writes a CAPTURED_UNSETTLED note only on an unpaid order without an existing note', async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    await recordCapturedUnsettled('o1', 'CAP1', '64.23', new Error('connection refused at db.internal:5432 password=hunter2'));
    const arg = mockUpdateMany.mock.calls[0][0] as { where: Record<string, unknown>; data: { paymentNote: string } };
    expect(arg.where).toMatchObject({ id: 'o1', isPaid: false });
    expect(arg.data.paymentNote).toContain('CAPTURED_UNSETTLED');
    expect(arg.data.paymentNote).toContain('CAP1');
    expect(arg.data.paymentNote).toContain('reason=UNKNOWN');
    expect(arg.data.paymentNote).not.toContain('hunter2');
    expect(arg.data.paymentNote).not.toContain('db.internal');
  });
  test('skips when a concurrent call already settled the order', async () => {
    mockUpdateMany.mockClear();
    await recordCapturedUnsettled('o1', 'CAP1', '64.23', new Error('Order is already paid'));
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
  test('never throws when the note write itself fails', async () => {
    mockUpdateMany.mockRejectedValue(new Error('db down'));
    await expect(recordCapturedUnsettled('o1', 'CAP1', '1.00', new Error('x'))).resolves.toBeUndefined();
  });
});
