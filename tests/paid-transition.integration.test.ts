import {localDatabaseTestEnabled,localPsqlUrl} from './helpers/local-database';
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
import { updateOrderToPaid, updateOrderToPaidSimulated } from '@/lib/order-settlement';
import { enqueueFulfillmentTask } from '@/lib/fulfillment-queue';
import { findPaidOrdersNeedingAttention, findPaidOrdersNeedingAttentionPage } from '@/lib/paid-reconciliation';

const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = localDatabaseTestEnabled()?describe:describe.skip;

function psql(sql: string) {
  const f = `/tmp/itest-${process.pid}-${Math.random().toString(36).slice(2)}.sql`;
  writeFileSync(f, sql);
  try {
    execSync(`psql "${localPsqlUrl()}" -v ON_ERROR_STOP=1 -f ${f}`, { stdio: 'pipe' });
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
      // Remove this run's own rows so reruns on the same disposable DB stay isolated
      // (reconciliation reads the oldest 200 paid orders).
      try {
        psql(`DELETE FROM "FulfillmentTask" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" = '${userId}');
DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "userId" = '${userId}');
DELETE FROM "Order" WHERE "userId" = '${userId}';
DELETE FROM "Product" WHERE slug LIKE 'pt-${suffix}-%';
DELETE FROM "User" WHERE id = '${userId}';`);
      } catch (e) {
        console.warn('paid-transition test cleanup skipped:', (e as Error).message.slice(0, 120));
      }
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

  beforeEach(() => { jest.clearAllMocks(); process.env.FULFILLMENT_DISPATCH_ENABLED = 'true'; });
  afterAll(() => { delete process.env.FULFILLMENT_DISPATCH_ENABLED; });

  it('supplier dispatch is opt-in: paid order, keys present, FULFILLMENT_DISPATCH_ENABLED unset -> no supplier call, order still paid', async () => {
    delete process.env.FULFILLMENT_DISPATCH_ENABLED;
    const { order } = await makeOrder({ qty: 1, stock: 5 });
    await updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
  });

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


  it.each([false, true])('different orders race for one unit, simulated=%s: one paid, no negative stock', async (simulated) => {
    const { order, product } = await makeOrder({ qty: 1, stock: 1, method: simulated ? 'TestPayment' : 'PayPal' });
    const second = await prisma.order.create({ data: {
      userId, shippingAddress: {}, paymentMethod: simulated ? 'TestPayment' : 'PayPal',
      itemsPrice: '42.50', shippingPrice: 0, taxPrice: 0, totalPrice: '42.50',
      orderitems: { create: [{ productId: product.id, qty: 1, price: '42.50', name: 'last unit', slug: product.slug, image: 'x' }] },
    } });
    const pay = (id: string) => simulated ? updateOrderToPaidSimulated(id) : updateOrderToPaid({ orderId: id, paymentResult: pr('42.50') });
    const res = await settle([pay(order.id), pay(second.id)]);
    expect(res.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const loser = res.find(r => r.status === 'rejected') as PromiseRejectedResult;
    expect(loser.reason.settlementCode).toBe('STOCK_UNAVAILABLE');
    expect(await stockOf(product.id)).toBe(0);
    const rows = await prisma.order.findMany({ where: { id: { in: [order.id, second.id] } } });
    expect(rows.filter(o => o.isPaid)).toHaveLength(1);
    expect(rows.find(o => !o.isPaid)?.paidAt).toBeNull();
    expect(dispatch).toHaveBeenCalledTimes(simulated ? 0 : 1);
    expect(sendConfirm).toHaveBeenCalledTimes(simulated ? 0 : 1);
  });

  it('later unavailable line rolls back earlier stock and paid claim', async () => {
    const { order, product } = await makeOrder({ qty: 1, stock: 2 });
    const missing = await prisma.product.create({ data: { id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', name: 'out', slug: `pt-${suffix}-out`, category: 'c', images: [], description: 'd', stock: 0, price: 1 } });
    await prisma.orderItem.create({ data: { orderId: order.id, productId: missing.id, qty: 1, price: 1, name: 'out', slug: missing.slug, image: 'x' } });
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })).rejects.toMatchObject({ settlementCode: 'STOCK_UNAVAILABLE' });
    expect(await stockOf(product.id)).toBe(2);
    expect(await stockOf(missing.id)).toBe(0);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
    expect(sendConfirm).not.toHaveBeenCalled();
  });

  it('paid claim commits passive evidence once; replay does not duplicate it; never runnable', async () => {
    const { order } = await makeOrder();
    await updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') });
    const tasks = await prisma.fulfillmentTask.findMany({ where: { orderId: order.id, supplier: 'PAYMENT_EFFECT_REVIEW' } });
    expect(tasks).toHaveLength(1); expect(tasks[0].status).toBe('REVIEW_ONLY'); expect(tasks[0].maxAttempts).toBe(0);
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })).rejects.toThrow('already paid');
    expect(await prisma.fulfillmentTask.count({ where: { orderId: order.id, supplier: 'PAYMENT_EFFECT_REVIEW' } })).toBe(1);
    const { dueFulfillmentTasks } = await import('@/lib/fulfillment-queue');
    expect((await dueFulfillmentTasks()).some(t => t.id === tasks[0].id)).toBe(false);
  });

  it('crash after paid commit retains passive evidence and does not make it runnable', async () => {
    const { order } = await makeOrder();
    sendConfirm.mockImplementationOnce(() => { throw new Error('injected crash after paid commit'); });
    await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })).rejects.toThrow('injected crash');
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(true);
    expect(await prisma.fulfillmentTask.count({ where: { orderId: order.id, status: 'REVIEW_ONLY' } })).toBe(1);
    const { dueFulfillmentTasks } = await import('@/lib/fulfillment-queue');
    expect((await dueFulfillmentTasks()).some(t => t.orderId === order.id)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('passive evidence failure rolls back stock and paid claim, with no side effects', async () => {
    const { order, product } = await makeOrder();
    psql(`CREATE OR REPLACE FUNCTION pt_fail_review() RETURNS trigger AS $b$ BEGIN RAISE EXCEPTION 'injected passive evidence failure'; END; $b$ LANGUAGE plpgsql;`);
    psql(`CREATE TRIGGER pt_fail_review_trg BEFORE INSERT ON "FulfillmentTask" FOR EACH ROW WHEN (NEW."orderId" = '${order.id}') EXECUTE FUNCTION pt_fail_review()`);
    try {
      await expect(updateOrderToPaid({ orderId: order.id, paymentResult: pr('42.50') })).rejects.toThrow();
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).isPaid).toBe(false);
      expect(await stockOf(product.id)).toBe(10);
      expect(await prisma.fulfillmentTask.count({ where: { orderId: order.id } })).toBe(0);
      expect(dispatch).not.toHaveBeenCalled(); expect(sendConfirm).not.toHaveBeenCalled();
    } finally { psql('DROP TRIGGER IF EXISTS pt_fail_review_trg ON "FulfillmentTask"'); psql('DROP FUNCTION IF EXISTS pt_fail_review()'); }
  });

  it.each(['sandbox', 'live', 'unknown'] as const)('preserves stored %s environment through settlement', async (paypalEnv) => {
    const { order } = await makeOrder();
    await prisma.order.update({ where: { id: order.id }, data: { paymentResult: { id: 'PP', paypalEnv } } });
    await updateOrderToPaid({ orderId: order.id, paymentResult: { ...pr('42.50'), paypalEnv: 'live' } });
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.paymentResult).toMatchObject({ paypalEnv });
  });

  it('legacy absence remains absent rather than adopting incoming or current environment', async () => {
    const { order } = await makeOrder();
    await updateOrderToPaid({ orderId: order.id, paymentResult: { ...pr('42.50'), paypalEnv: 'sandbox' } });
    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.paymentResult).not.toHaveProperty('paypalEnv');
  });

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

  it('paging reaches a paid order beyond the first page on real rows (no starvation)', async () => {
    const made: string[] = [];
    for (let n = 0; n < 4; n++) {
      const { order } = await makeOrder();
      await prisma.order.update({ where: { id: order.id }, data: { isPaid: true, paidAt: new Date(Date.now() - 3600_000 - n * 1000) } });
      made.push(order.id);
    }
    const seen: string[] = [];
    let after = null as { id: string } | null;
    for (let guard = 0; guard < 1000; guard++) {
      const page = await findPaidOrdersNeedingAttentionPage(prisma as never, { limit: 2, after });
      seen.push(...page.items.map((i) => i.orderId));
      if (!page.nextCursor) break;
      after = page.nextCursor;
    }
    for (const id of made) expect(seen).toContain(id);
    // Same-timestamp orders with microsecond precision must still page without repeats.
    await prisma.$executeRawUnsafe(`UPDATE "Order" SET "paidAt" = (now() at time zone 'utc') - interval '2 hours 0.123456 seconds' WHERE id IN (${made.map((m) => `'${m}'`).join(',')})`);
    const seen2: string[] = [];
    let after2 = null as { id: string } | null;
    for (let guard = 0; guard < 1000; guard++) {
      const page = await findPaidOrdersNeedingAttentionPage(prisma as never, { limit: 2, after: after2 });
      seen2.push(...page.items.map((i) => i.orderId));
      if (!page.nextCursor) break;
      after2 = page.nextCursor;
    }
    expect(new Set(seen2).size).toBe(seen2.length);
    for (const id of made) expect(seen2).toContain(id);
    expect(new Set(seen).size).toBe(seen.length);
  }, 30000);

  // ---- Read-only reconciliation on real rows ----
  it('reconciliation finds a paid order with no dispatch record and changes nothing', async () => {
    const { order } = await makeOrder();
    await prisma.order.update({ where: { id: order.id }, data: { isPaid: true, paidAt: new Date(Date.now() - 3600_000) } });
    const before = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    const items: Awaited<ReturnType<typeof findPaidOrdersNeedingAttention>> = [];
    let cur = null as { id: string } | null;
    for (let guard = 0; guard < 1000; guard++) {
      const pg = await findPaidOrdersNeedingAttentionPage(prisma as never, { after: cur });
      items.push(...pg.items);
      if (!pg.nextCursor) break;
      cur = pg.nextCursor;
    }
    expect(items.map((i) => i.orderId)).toContain(order.id);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
    expect(dispatch).not.toHaveBeenCalled();
  }, 20000);
});
