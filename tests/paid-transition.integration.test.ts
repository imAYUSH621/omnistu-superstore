/**
 * REAL Postgres integration test for the paid transition (concurrency, replay, rollback).
 * Mocked boundaries: auth, outbound email, Supabase mirror sync, supplier dispatch, receipts,
 * Next cache. No provider contact, no money. Requires REFUND_ITEST_DATABASE_URL (disposable DB).
 */
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

const mockAuth = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
const sendConfirm = jest.fn(async () => undefined);
const sendReceipt = jest.fn(async () => undefined);
const syncSb = jest.fn(async () => undefined);
const dispatch = jest.fn(async () => ({ results: [] }));
jest.mock('@/lib/mailer', () => ({ sendOrderConfirmationEmail: (...a: unknown[]) => (sendConfirm as (...x: unknown[]) => unknown)(...a) }));
jest.mock('@/email', () => ({ sendPurchaseReceipt: (...a: unknown[]) => (sendReceipt as (...x: unknown[]) => unknown)(...a) }));
jest.mock('@/lib/providers/supabase-sync', () => ({ syncOrderToSupabase: (...a: unknown[]) => (syncSb as (...x: unknown[]) => unknown)(...a) }));
jest.mock('@/lib/fulfillment-dispatcher', () => ({ dispatchOrderFulfillment: (...a: unknown[]) => (dispatch as (...x: unknown[]) => unknown)(...a) }));
jest.mock('@/lib/fulfillment-persistence', () => ({ persistDispatchSummary: jest.fn(async () => undefined) }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

import { prisma } from '@/db/prisma';
import { updateOrderToPaidCOD } from '@/lib/actions/order.actions';
import { updateOrderToPaid } from '@/lib/order-settlement';
import { enqueueFulfillmentTask } from '@/lib/fulfillment-queue';
import { findPaidOrdersNeedingAttention } from '@/lib/paid-reconciliation';

const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB ? describe : describe.skip;

function psql(sql: string) {
  const f = `/tmp/itest-${process.pid}-${Math.random().toString(36).slice(2)}.sql`;
  writeFileSync(f, sql);
  try {
    execSync(`psql "${DB}" -v ON_ERROR_STOP=1 -f ${f}`, { stdio: 'pipe' });
  } finally {
    unlinkSync(f);
  }
}

maybe('paid transition on REAL Postgres (sandbox, disposable)', () => {
  let userId = '';
  const suffix = Date.now().toString(36);

  beforeAll(async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    const u = await prisma.user.create({ data: { name: 'PT', email: `pt-${suffix}@example.com`, password: 'x', role: 'user' } });
    userId = u.id;
  }, 30000);

  afterAll(async () => {
    if (DB) {
      psql(`DROP TRIGGER IF EXISTS pt_fail_stock_trg ON "Product"`);
      psql(`DROP FUNCTION IF EXISTS pt_fail_stock()`);
    }
    await prisma.$disconnect();
  }, 30000);

  async function makeOrder(opts: { total?: string; qty?: number; stock?: number; method?: string } = {}) {
    const total = opts.total ?? '42.50';
    const product = await prisma.product.create({
      data: { name: 'PT item', slug: `pt-${suffix}-${Math.random().toString(36).slice(2)}`, category: 'c', images: [], brand: 'b', description: 'd', stock: opts.stock ?? 10, price: total },
    });
    const order = await prisma.order.create({
      data: {
        userId,
        shippingAddress: { fullName: 'P T', address: '1 St', city: 'C', postalCode: '1', country: 'US' },
        paymentMethod: opts.method ?? 'Stripe',
        itemsPrice: total, shippingPrice: '0', taxPrice: '0', totalPrice: total,
        orderitems: { create: [{ productId: product.id, qty: opts.qty ?? 2, price: total, name: 'PT item', slug: product.slug, image: 'x' }] },
      },
    });
    return { order, product };
  }
  const pr = (amount: string) => ({ id: 'ch_x', status: 'COMPLETED', email_address: 'a@b.co', pricePaid: amount });
  const stockOf = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;
  const settle = (ps: Promise<unknown>[]) => Promise.allSettled(ps);

  beforeEach(() => { jest.clearAllMocks(); });

  it.each([2, 5])('%i concurrent paid calls: exactly one wins, stock decremented once, side effects once', async (n) => {
    const { order, product } = await makeOrder({ qty: 2, stock: 10 });
    const res = await settle(Array.from({ length: n }, () => updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })));
    expect(res.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(res.filter((r) => r.status === 'rejected')).toHaveLength(n - 1);
    expect(await stockOf(product.id)).toBe(8);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(true);
    expect(syncSb).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(sendConfirm).toHaveBeenCalledTimes(1);
  }, 30000);

  it('replay after paid is rejected and changes nothing', async () => {
    const { order, product } = await makeOrder();
    await updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') });
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })).rejects.toThrow(/already paid/);
    expect(await stockOf(product.id)).toBe(8);
    expect(dispatch).toHaveBeenCalledTimes(1);
  }, 20000);

  it('COD/manual path racing a gateway payment on the same order: one winner, one stock decrement', async () => {
    const { order, product } = await makeOrder({ method: 'CashOnDelivery' });
    const res = await settle([updateOrderToPaidCOD(order.id), updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') }), updateOrderToPaidCOD(order.id)]);
    const wins = res.filter((r) => r.status === 'fulfilled' && (r.value as { success?: boolean } | undefined)?.success !== false);
    expect(wins).toHaveLength(1);
    expect(await stockOf(product.id)).toBe(8);
    expect(dispatch).toHaveBeenCalledTimes(1);
  }, 30000);

  it('failed transaction (stock update raises) rolls back the paid claim; order stays unpaid and retry succeeds', async () => {
    const { order, product } = await makeOrder();
    psql(`CREATE OR REPLACE FUNCTION pt_fail_stock() RETURNS trigger AS $b$ BEGIN RAISE EXCEPTION 'injected stock failure'; END; $b$ LANGUAGE plpgsql;`);
    psql(`DROP TRIGGER IF EXISTS pt_fail_stock_trg ON "Product"`);
    psql(`CREATE TRIGGER pt_fail_stock_trg BEFORE UPDATE ON "Product" FOR EACH ROW WHEN (NEW.id = '${product.id}') EXECUTE FUNCTION pt_fail_stock()`);
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })).rejects.toThrow();
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.isPaid).toBe(false);
    expect(after.paidAt).toBeNull();
    expect(await stockOf(product.id)).toBe(10);
    expect(dispatch).not.toHaveBeenCalled();
    psql(`DROP TRIGGER pt_fail_stock_trg ON "Product"`);
    await updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') });
    expect(await stockOf(product.id)).toBe(8);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(true);
  }, 30000);

  it('one-cent underpayment is rejected, noted, order stays unpaid with stock untouched', async () => {
    const { order, product } = await makeOrder();
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.49') })).rejects.toThrow(/does not match/);
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(o.isPaid).toBe(false);
    expect(o.paymentNote).toContain('AMOUNT_MISMATCH');
    expect(await stockOf(product.id)).toBe(10);
  }, 20000);

  it('a mismatching late call never overwrites the paymentResult of an already paid order', async () => {
    const { order } = await makeOrder();
    await updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') });
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('1.00') })).rejects.toThrow();
    const o = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect((o.paymentResult as { pricePaid?: string }).pricePaid).toBe('42.50');
    expect(o.paymentNote ?? '').not.toContain('AMOUNT_MISMATCH');
  }, 20000);

  // ---- Passive outbox preparation (NOT wired into updateOrderToPaid; see design decision) ----
  it('outbox row recorded in the same transaction as the paid claim commits atomically with it', async () => {
    const { order } = await makeOrder();
    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({ where: { id: order.id, isPaid: false }, data: { isPaid: true, paidAt: new Date() } });
      await enqueueFulfillmentTask({ orderId: order.id, supplier: 'ORDER_EFFECTS', payload: { kind: 'post-payment-effects' }, tx });
    });
    expect(await prisma.fulfillmentTask.count({ where: { orderId: order.id } })).toBe(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(true);
  }, 20000);

  it('simulated crash (tx aborts after enqueue): neither the paid claim nor the task survives', async () => {
    const { order } = await makeOrder();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.order.updateMany({ where: { id: order.id, isPaid: false }, data: { isPaid: true, paidAt: new Date() } });
        await enqueueFulfillmentTask({ orderId: order.id, supplier: 'ORDER_EFFECTS', payload: {}, tx });
        throw new Error('crash before commit');
      })
    ).rejects.toThrow('crash before commit');
    expect(await prisma.fulfillmentTask.count({ where: { orderId: order.id } })).toBe(0);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(false);
  }, 20000);

  it('duplicate enqueue in a transaction is deduplicated (one active task per order+supplier)', async () => {
    const { order } = await makeOrder();
    const r = await prisma.$transaction(async (tx) => {
      const a = await enqueueFulfillmentTask({ orderId: order.id, supplier: 'ORDER_EFFECTS', payload: {}, tx });
      const b = await enqueueFulfillmentTask({ orderId: order.id, supplier: 'ORDER_EFFECTS', payload: {}, tx });
      return [a, b];
    });
    expect(r[1].deduplicated).toBe(true);
    expect(await prisma.fulfillmentTask.count({ where: { orderId: order.id } })).toBe(1);
  }, 20000);

  // ---- Read-only reconciliation on real rows ----
  it('reconciliation finds a paid order with no dispatch record and changes nothing', async () => {
    const { order } = await makeOrder();
    await prisma.order.update({ where: { id: order.id }, data: { isPaid: true, paidAt: new Date(Date.now() - 3600_000) } });
    const before = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    const items = await findPaidOrdersNeedingAttention(prisma as never);
    expect(items.map((i) => i.orderId)).toContain(order.id);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
    expect(dispatch).not.toHaveBeenCalled();
  }, 20000);
});
