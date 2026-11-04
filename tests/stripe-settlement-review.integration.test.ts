/** Disposable local Postgres only. Stripe signature/event parser mocked, no provider/network/money. */
const mockEvent = jest.fn();
const mockSideEffect = jest.fn(async () => undefined);
jest.mock('stripe', () => ({ __esModule: true, default: { webhooks: { constructEvent: (...a: unknown[]) => mockEvent(...a) } } }));
jest.mock('@/lib/mailer', () => ({ sendOrderConfirmationEmail: () => mockSideEffect() }));
jest.mock('@/email', () => ({ sendPurchaseReceipt: () => mockSideEffect() }));
jest.mock('@/lib/providers/supabase-sync', () => ({ syncOrderToSupabase: () => mockSideEffect() }));
jest.mock('@/lib/fulfillment-dispatcher', () => ({ dispatchOrderFulfillment: () => mockSideEffect() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
import { prisma } from '@/db/prisma';
import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB && DB === process.env.DATABASE_URL && DB.includes('localhost') ? describe : describe.skip;
const request = () => new NextRequest('https://omnistu.test/api/webhooks/stripe', { method: 'POST', body: '{}', headers: { 'stripe-signature': 'mocked' } });
maybe('Stripe confirmed charge recovery with real disposable DB', () => {
  let userId = ''; let productId = ''; const ids: string[] = [];
  beforeAll(async () => {
    userId = (await prisma.user.create({ data: { name: 'stripe test', email: `stripe-${Date.now()}@example.test`, password: 'x' } })).id;
    productId = (await prisma.product.create({ data: { name: 'stripe test', slug: `stripe-${Date.now()}`, category: 'test', images: [], description: 'test', stock: 0, price: 5 } })).id;
  });
  afterAll(async () => { await prisma.order.deleteMany({ where: { userId } }); await prisma.product.deleteMany({ where: { id: productId } }); await prisma.user.delete({ where: { id: userId } }); await prisma.$disconnect(); });
  async function order() {
    const row = await prisma.order.create({ data: { userId, paymentMethod: 'Stripe', shippingAddress: {}, itemsPrice: 5, shippingPrice: 0, taxPrice: 0, totalPrice: 5, paymentNote: 'OWNER keep', orderitems: { create: [{ productId, qty: 1, price: 5, name: 'test', slug: 'test', image: 'x' }] } } });
    ids.push(row.id);
    mockEvent.mockReturnValue({ type: 'charge.succeeded', data: { object: { id: `ch_${row.id}`, currency: 'usd', amount: 500, metadata: { orderId: row.id }, billing_details: {} } } });
    return row.id;
  }
  it('stock failure preserves intake+prior note+incident; duplicate does not settle when stock later becomes available', async () => {
    const id = await order();
    expect((await POST(request())).status).toBe(200);
    let row = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(row.isPaid).toBe(false); expect(row.paymentNote).toContain('OWNER keep'); expect(row.paymentNote).toContain('STRIPE_SETTLEMENT_REQUESTED'); expect(row.paymentNote).toContain('CAPTURED_UNSETTLED reason=STOCK_UNAVAILABLE');
    await prisma.product.update({ where: { id: productId }, data: { stock: 2 } });
    expect((await POST(request())).status).toBe(200);
    row = await prisma.order.findUniqueOrThrow({ where: { id } }); expect(row.isPaid).toBe(false);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(2);
    expect(mockSideEffect).not.toHaveBeenCalled();
  });
  it('concurrent healthy events settle at most once and replay is acknowledged', async () => {
    const id = await order(); mockSideEffect.mockClear();
    const rs = await Promise.all([POST(request()), POST(request())]); expect(rs.some(r => r.status === 200)).toBe(true);
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).isPaid).toBe(true);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(1);
    expect((await POST(request())).status).toBe(200);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(1);
  });
});
