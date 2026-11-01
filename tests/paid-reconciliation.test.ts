import { classifyPaidOrder, findPaidOrdersNeedingAttention, findPaidOrdersNeedingAttentionPage, DISPATCH_GRACE_MS } from '@/lib/paid-reconciliation';

const now = new Date('2026-11-01T12:00:00Z');
const old = new Date(now.getTime() - DISPATCH_GRACE_MS - 1000);
const fresh = new Date(now.getTime() - 60_000);
const row = (o: Partial<Parameters<typeof classifyPaidOrder>[0]>) => ({ id: 'o', isPaid: true, paidAt: old, dispatchStatus: null, dispatchError: null, supplierOrderId: null, ...o });

describe('classifyPaidOrder (read-only reconciliation)', () => {
  it('flags a paid order with no dispatch record after the grace window', () => {
    expect(classifyPaidOrder(row({}), now)?.reason).toBe('NO_DISPATCH_RECORD');
  });
  it('does not flag one still inside the grace window (background dispatch may be running)', () => {
    expect(classifyPaidOrder(row({ paidAt: fresh }), now)).toBeNull();
  });
  it('flags failed, partial and no-items dispatches regardless of age', () => {
    for (const s of ['FAILED', 'PARTIAL', 'NO_ITEMS', 'FAILED+SKIPPED']) {
      expect(classifyPaidOrder(row({ dispatchStatus: s, paidAt: fresh }), now)?.reason).toBe('DISPATCH_NOT_COMPLETE');
    }
  });
  it('ignores dispatched and unpaid orders', () => {
    expect(classifyPaidOrder(row({ dispatchStatus: 'DISPATCHED' }), now)).toBeNull();
    expect(classifyPaidOrder(row({ isPaid: false }), now)).toBeNull();
  });
  it('always carries the unknown-outcome / no-blind-retry guidance', () => {
    expect(classifyPaidOrder(row({}), now)?.guidance).toMatch(/UNKNOWN.*Do not retry automatically/);
  });
});

describe('findPaidOrdersNeedingAttention', () => {
  it('only reads: calls findMany once with a paid-only where and no write methods', async () => {
    const findMany = jest.fn(async () => [row({ id: 'a' }), row({ id: 'b', dispatchStatus: 'DISPATCHED' })]);
    const db = { order: { findMany } };
    const out = await findPaidOrdersNeedingAttention(db, now);
    expect(out.map((i) => i.orderId)).toEqual(['a']);
    expect(findMany).toHaveBeenCalledTimes(1);
    const args = (findMany.mock.calls[0] as unknown[])[0] as { where: { isPaid: boolean } };
    expect(args.where.isPaid).toBe(true);
  });
});

describe('findPaidOrdersNeedingAttentionPage', () => {
  it('asks for limit+1, returns a cursor when more exist, and a null cursor on the last page', async () => {
    const rows = [1, 2, 3].map((n) => row({ id: 'o' + n, dispatchStatus: 'FAILED', paidAt: new Date(2026, 0, n) }));
    const findMany = jest.fn(async () => rows);
    const p1 = await findPaidOrdersNeedingAttentionPage({ order: { findMany } }, { now, limit: 2 });
    expect(p1.items.map((i) => i.orderId)).toEqual(['o1', 'o2']);
    expect(p1.nextCursor).toEqual({ paidAt: new Date(2026, 0, 2).toISOString(), id: 'o2' });
    expect(((findMany.mock.calls[0] as unknown[])[0] as { take: number }).take).toBe(3);
    const findMany2 = jest.fn(async () => [rows[2]]);
    const p2 = await findPaidOrdersNeedingAttentionPage({ order: { findMany: findMany2 } }, { now, limit: 2, after: p1.nextCursor });
    expect(p2.items.map((i) => i.orderId)).toEqual(['o3']);
    expect(p2.nextCursor).toBeNull();
    const w = JSON.stringify(((findMany2.mock.calls[0] as unknown[])[0] as { where: unknown }).where);
    expect(w).toContain('"id":{"gt":"o2"}');
  });
});

describe('cursor after a null-paidAt order', () => {
  it('can continue into orders that have a paidAt', async () => {
    const findMany = jest.fn(async () => []);
    await findPaidOrdersNeedingAttentionPage({ order: { findMany } }, { now, limit: 2, after: { paidAt: null, id: 'x' } });
    const w = JSON.stringify(((findMany.mock.calls[0] as unknown[])[0] as { where: unknown }).where);
    expect(w).toContain('"paidAt":{"not":null}');
  });
});
