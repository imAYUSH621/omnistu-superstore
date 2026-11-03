/**
 * Capture -> settlement failure regression through the REAL approvePayPalOrder orchestration.
 * PayPal is mocked (a COMPLETED capture, no network); the DB is a disposable Postgres with a temporary
 * CHECK (stock >= 0) so the paid transaction fails for real. Asserts: the buyer sees an error, the order
 * stays unpaid, the CAPTURED_UNSETTLED incident is recorded (prior note kept), the admin query lists it,
 * and no dispatch, mail, mirror or second capture happens. Runs ONLY when REFUND_ITEST_DATABASE_URL equals
 * DATABASE_URL (explicit opt-in to a disposable DB), because it adds and drops a constraint.
 */
const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB && process.env.DATABASE_URL === DB && !DB.includes('supabase') ? describe : describe.skip;

const mockAuth = jest.fn();
const mockCapture = jest.fn();
const mockDispatch = jest.fn();
const mockMail = jest.fn();
const mockMirror = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
jest.mock('@/lib/paypal', () => ({ paypal: { capturePayment: (...a: unknown[]) => mockCapture(...a), createOrder: jest.fn() } }));
jest.mock('@/lib/fulfillment-dispatcher', () => ({ dispatchOrderFulfillment: (...a: unknown[]) => mockDispatch(...a) }));
jest.mock('@/lib/mailer', () => ({ sendOrderConfirmationEmail: (...a: unknown[]) => mockMail(...a) }));
jest.mock('@/email', () => ({ sendPurchaseReceipt: (...a: unknown[]) => mockMail(...a) }));
jest.mock('@/lib/providers/supabase-sync', () => ({ syncOrderToSupabase: (...a: unknown[]) => mockMirror(...a) }));
jest.mock('@/lib/actions/cart.actions', () => ({ getMyCart: jest.fn() }));
jest.mock('@/lib/actions/user.actions', () => ({ getUserById: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

maybe('capture then settlement failure (real DB, mocked provider)', () => {
  const email = `capfail-${Date.now()}@example.test`;
  const slug = `capfail-${Date.now()}`;
  let userId = '';
  let productId = '';
  let orderId = '';

  beforeAll(async () => {
    const { prisma } = await import('@/db/prisma');
    await prisma.$executeRawUnsafe('ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS capfail_stock_nonneg');
    userId = (await prisma.user.create({ data: { name: 'Capfail', email, password: 'x' } })).id;
    productId = (
      await prisma.product.create({
        data: { name: 'Capfail item', slug, category: 'test', images: ['/x.jpg'], description: 'd', stock: 1, price: 1, rating: 0, numReviews: 0 } as never,
      })
    ).id;
    orderId = (
      await prisma.order.create({
        data: {
          userId,
          shippingAddress: {},
          paymentMethod: 'PayPal',
          itemsPrice: 5,
          shippingPrice: 0,
          taxPrice: 0,
          totalPrice: 5,
          paymentNote: 'OWNER NOTE keep me',
          paymentResult: { id: 'PP-CAPFAIL' },
          orderitems: { create: [{ productId, qty: 3, price: 1, name: 'Capfail item', slug, image: '/x.jpg' }] },
        } as never,
      })
    ).id;
    // From here a decrement below zero violates the constraint, so the paid transaction really fails.
    await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD CONSTRAINT capfail_stock_nonneg CHECK (stock >= 0) NOT VALID');
  });
  afterAll(async () => {
    const { prisma } = await import('@/db/prisma');
    await prisma.$executeRawUnsafe('ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS capfail_stock_nonneg');
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { slug } });
    await prisma.user.deleteMany({ where: { email } });
  });

  test('capture succeeds, settlement fails: incident recorded, order unpaid, nothing dispatched', async () => {
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockResolvedValue({
      id: 'PP-CAPFAIL',
      status: 'COMPLETED',
      payer: { email_address: 'buyer@example.test' },
      purchase_units: [{ payments: { captures: [{ status: 'COMPLETED', amount: { value: '5.00', currency_code: 'USD' } }] } }],
    });
    const { approvePayPalOrder } = await import('@/lib/actions/order.actions');
    const r = await approvePayPalOrder(orderId, { orderID: 'PP-CAPFAIL' });
    expect(r.success).toBe(false);
    expect(r.message).toContain('do not pay again');
    expect(r.message).not.toMatch(/Invalid|tx\.product|constraint|Postgres/i);

    const { prisma } = await import('@/db/prisma');
    const o = await prisma.order.findUnique({ where: { id: orderId }, select: { isPaid: true, paymentNote: true } });
    expect(o?.isPaid).toBe(false);
    expect(o?.paymentNote?.startsWith('OWNER NOTE keep me')).toBe(true);
    expect(o?.paymentNote).toContain('CAPTURED_UNSETTLED reason=DB_ERROR capture=PPCAPFAIL'.replace('PPCAPFAIL', 'PP-CAPFAIL'));
    expect(o?.paymentNote).toContain('no refund or retry performed');

    // stock rolled back with the failed transaction
    expect((await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } }))?.stock).toBe(1);

    // listed for admin review
    mockAuth.mockResolvedValue({ user: { id: 'adm', role: 'admin' } });
    const { getUnsettledCaptures } = await import('@/lib/actions/reconcile.actions');
    const listing = await getUnsettledCaptures();
    expect(listing.success && listing.items.some((i) => i.orderId === orderId)).toBe(true);

    // exactly one capture call, no downstream effects
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockMail).not.toHaveBeenCalled();
    expect(mockMirror).not.toHaveBeenCalled();
  });
});
