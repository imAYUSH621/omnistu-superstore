/** Disposable local DB; provider fully mocked. No real Stripe call or credential. */
const mockCreate = jest.fn(); const mockRetrieve = jest.fn();
jest.mock('@/lib/payment-capabilities', () => ({ isPaymentMethodAvailable: () => true }));
jest.mock('stripe', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({ paymentIntents: { create: (...a: unknown[]) => mockCreate(...a), retrieve: (...a: unknown[]) => mockRetrieve(...a) } })) }));
import { prisma } from '@/db/prisma';
import { stripeClientSecretForOrder } from '@/lib/stripe-intent';
const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB && DB === process.env.DATABASE_URL && DB.includes('localhost') ? describe : describe.skip;
maybe('Stripe intent durable binding on local Postgres', () => {
  let userId = '';
  beforeAll(async () => { userId = (await prisma.user.create({ data: { name: 'intent', email: `intent-${Date.now()}@example.test`, password: 'x' } })).id; });
  afterAll(async () => { await prisma.order.deleteMany({ where: { userId } }); await prisma.user.delete({ where: { id: userId } }); await prisma.$disconnect(); });
  const order = () => prisma.order.create({ data: { userId, shippingAddress: {}, paymentMethod: 'Stripe', itemsPrice: 5, shippingPrice: 0, taxPrice: 0, totalPrice: 5 } });
  it('parallel renders create one intent and later renders reuse stored binding', async () => {
    const o = await order(); const intent = { id: 'pi_ONCE', amount: 500, currency: 'usd', metadata: { orderId: o.id }, status: 'requires_payment_method', client_secret: 'mock-secret' };
    mockCreate.mockReset(); mockCreate.mockResolvedValue(intent); mockRetrieve.mockResolvedValue(intent);
    const results = await Promise.all([stripeClientSecretForOrder(o.id), stripeClientSecretForOrder(o.id)]);
    expect(mockCreate).toHaveBeenCalledTimes(1); expect(results).toContain('mock-secret');
    const bound = await prisma.order.findUniqueOrThrow({ where: { id: o.id } }); expect(bound.paymentResult).toMatchObject({ id: 'pi_ONCE', status: 'INTENT_CREATED' }); expect(bound.paymentNote).toBeNull();
    expect(await stripeClientSecretForOrder(o.id)).toBe('mock-secret'); expect(mockCreate).toHaveBeenCalledTimes(1);
  });
  it('provider failure leaves durable marker and refresh never creates another intent', async () => {
    const o = await order(); mockCreate.mockReset(); mockCreate.mockRejectedValue(new Error('unreadable provider response'));
    expect(await stripeClientSecretForOrder(o.id)).toBeNull();
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).paymentNote).toContain('STRIPE_INTENT_REQUESTED');
    expect(await stripeClientSecretForOrder(o.id)).toBeNull(); expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
