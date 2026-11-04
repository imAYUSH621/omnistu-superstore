/**
 * Capture -> settlement failure regression through the REAL approvePayPalOrder orchestration.
 * PayPal is mocked (a COMPLETED capture, no network); the DB is a disposable Postgres with insufficient stock so the paid transaction fails for real. Asserts: the buyer sees an error, the order
 * stays unpaid, the CAPTURED_UNSETTLED incident is recorded (prior note kept), the admin query lists it,
 * and no dispatch, mail, mirror or second capture happens. Runs ONLY when REFUND_ITEST_DATABASE_URL equals
 * DATABASE_URL (explicit opt-in to a disposable DB).
 */
const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB && process.env.DATABASE_URL === DB && !DB.includes('supabase') ? describe : describe.skip;

const mockAuth = jest.fn();
const mockCapture = jest.fn();
const mockCreate = jest.fn();
const mockDispatch = jest.fn();
const mockMail = jest.fn();
const mockMirror = jest.fn();
jest.mock('@/lib/payment-capabilities', () => ({ isPaymentMethodAvailable: () => true, testCheckoutMode: () => false }));
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
jest.mock('@/lib/paypal', () => ({ paypal: { capturePayment: (...a: unknown[]) => mockCapture(...a), createOrder: (...a: unknown[]) => mockCreate(...a), environment: 'sandbox' } }));
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
    // The new atomic stock guard rejects this shortage without relying on a schema constraint.
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
    expect(o?.paymentNote).toContain('CAPTURED_UNSETTLED reason=STOCK_UNAVAILABLE capture=PPCAPFAIL'.replace('PPCAPFAIL', 'PP-CAPFAIL'));
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

  test('database trigger failure AFTER completed capture still records DB_ERROR and no downstream effects', async () => {
    const { prisma } = await import('@/db/prisma');
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION capfail_injected() RETURNS trigger AS $b$ BEGIN RAISE EXCEPTION 'injected database failure'; END; $b$ LANGUAGE plpgsql`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER capfail_injected_trg BEFORE UPDATE ON "Product" FOR EACH ROW WHEN (NEW.id = '${productId}') EXECUTE FUNCTION capfail_injected()`);
    await prisma.order.update({ where: { id: orderId }, data: { paymentNote: 'OWNER NOTE keep me' } });
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockResolvedValue({ id: 'PP-CAPFAIL', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ status: 'COMPLETED', amount: { value: '5.00', currency_code: 'USD' } }] } }] });
    mockCapture.mockClear();
    try {
      const { approvePayPalOrder } = await import('@/lib/actions/order.actions');
      const result = await approvePayPalOrder(orderId, { orderID: 'PP-CAPFAIL' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('do not pay again');
      const row = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(row.isPaid).toBe(false);
      expect(row.paymentNote).toContain('CAPTURED_UNSETTLED reason=DB_ERROR');
      expect((await prisma.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(5);
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockMail).not.toHaveBeenCalled();
      expect(mockMirror).not.toHaveBeenCalled();
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS capfail_injected_trg ON "Product"');
      await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS capfail_injected()');
    }
  });

  const mkOrder = async (ppId: string) => {
    const { prisma } = await import('@/db/prisma');
    return (
      await prisma.order.create({
        data: { userId, shippingAddress: {}, paymentMethod: 'PayPal', itemsPrice: 5, shippingPrice: 0, taxPrice: 0, totalPrice: 5, paymentResult: { id: ppId } } as never,
      })
    ).id;
  };

  test('capture outcome UNKNOWN (network/5xx): review marker, never a "failed" or "received" claim', async () => {
    const id = await mkOrder('PP-UNK');
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockRejectedValueOnce(Object.assign(new Error('PayPal capture UNKNOWN: NETWORK_OR_TIMEOUT'), { outcome: 'UNKNOWN', detail: 'NETWORK_OR_TIMEOUT' }));
    const { approvePayPalOrder } = await import('@/lib/actions/order.actions');
    const r = await approvePayPalOrder(id, { orderID: 'PP-UNK' });
    expect(r.success).toBe(false);
    expect(r.message).toContain('could not confirm');
    expect(r.message).not.toMatch(/received|failed|declined/i);
    const { prisma } = await import('@/db/prisma');
    const n = (await prisma.order.findUnique({ where: { id }, select: { paymentNote: true, isPaid: true } }));
    expect(n?.isPaid).toBe(false);
    expect(n?.paymentNote).toContain('CAPTURE_UNCONFIRMED reason=NETWORK_OR_TIMEOUT');
    mockAuth.mockResolvedValue({ user: { id: 'adm', role: 'admin' } });
    const { getUnsettledCaptures } = await import('@/lib/actions/reconcile.actions');
    const listing = await getUnsettledCaptures();
    expect(listing.success && listing.items.some((i) => i.orderId === id && i.note.includes('CAPTURE_UNCONFIRMED'))).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('capture outcome REJECTED (declined): no incident, no money claim', async () => {
    const id = await mkOrder('PP-REJ');
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockRejectedValueOnce(Object.assign(new Error('PayPal capture REJECTED: HTTP_422'), { outcome: 'REJECTED', detail: 'HTTP_422' }));
    const { approvePayPalOrder } = await import('@/lib/actions/order.actions');
    const r = await approvePayPalOrder(id, { orderID: 'PP-REJ' });
    expect(r.success).toBe(false);
    expect(r.message).toBe('PayPal did not complete the payment.');
    const { prisma } = await import('@/db/prisma');
    expect((await prisma.order.findUnique({ where: { id }, select: { paymentNote: true } }))?.paymentNote).toContain('CAPTURE_REQUESTED');
  });

  test('two concurrent approvals send exactly one capture; interrupted attempt remains durable and reviewable', async () => {
    const id = await mkOrder('PP-RACE');
    const { prisma } = await import('@/db/prisma');
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockClear();
    let release!: () => void;
    let entered!: () => void;
    const enteredPromise = new Promise<void>(r => { entered = r; });
    mockCapture.mockImplementationOnce(async () => {
      entered();
      await new Promise<void>(r => { release = r; });
      throw Object.assign(new Error('provider reply lost'), { outcome: 'UNKNOWN', detail: 'NETWORK_OR_TIMEOUT' });
    });
    const { approvePayPalOrder, createPayPalOrder } = await import('@/lib/actions/order.actions');
    const first = approvePayPalOrder(id, { orderID: 'PP-RACE' });
    await enteredPromise;
    const during = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(during.paymentNote).toContain('CAPTURE_REQUESTED capture=PP-RACE');
    expect(during.isPaid).toBe(false);
    // Even before a provider reply/incident write, the pre-call marker blocks another request.
    const duplicate = await approvePayPalOrder(id, { orderID: 'PP-RACE' });
    expect(duplicate.success).toBe(false);
    expect(duplicate.message).toContain('do not pay again');
    mockCreate.mockClear();
    expect((await createPayPalOrder(id)).success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
    mockAuth.mockResolvedValue({ user: { id: 'adm', role: 'admin' } });
    const { getUnsettledCaptures } = await import('@/lib/actions/reconcile.actions');
    const listing = await getUnsettledCaptures();
    expect(listing.success && listing.items.some(i => i.orderId === id)).toBe(true);
    release();
    expect((await first).success).toBe(false);
    expect(mockCapture).toHaveBeenCalledTimes(1);
    const after = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(after.paymentNote).toContain('CAPTURE_REQUESTED');
    expect(after.paymentNote).toContain('CAPTURE_UNCONFIRMED');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('concurrent PayPal creation binds once, never replaces an existing binding', async () => {
    const id = await mkOrder('unused');
    const { prisma } = await import('@/db/prisma');
    const { Prisma } = await import('@prisma/client');
    await prisma.order.update({ where: { id }, data: { paymentResult: Prisma.DbNull } });
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ id: 'PP-ONCE' });
    const { createPayPalOrder } = await import('@/lib/actions/order.actions');
    await Promise.all([createPayPalOrder(id), createPayPalOrder(id)]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).paymentResult).toMatchObject({ id: 'PP-ONCE' });
    expect((await createPayPalOrder(id)).success).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('interrupted provider creation stays reviewable and does not expose provider error', async () => {
    const id = await mkOrder('unused-creation');
    const { prisma } = await import('@/db/prisma');
    const { Prisma } = await import('@prisma/client');
    await prisma.order.update({ where: { id }, data: { paymentResult: Prisma.DbNull } });
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCreate.mockReset(); mockCreate.mockRejectedValue(new Error('provider-secret-response'));
    const { createPayPalOrder } = await import('@/lib/actions/order.actions');
    const r = await createPayPalOrder(id);
    expect(r.success).toBe(false);
    expect(r.message).not.toContain('provider-secret');
    expect(r.message).toContain('do not pay again');
    expect((await prisma.order.findUniqueOrThrow({ where: { id } })).paymentNote).toContain('PAYPAL_CREATE_REQUESTED');
    await createPayPalOrder(id);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('amount mismatch preserves pre-call claim and earlier note, blocks a second capture', async () => {
    const id = await mkOrder('PP-AMOUNT');
    const { prisma } = await import('@/db/prisma');
    await prisma.order.update({ where: { id }, data: { paymentNote: 'OWNER NOTE keep me' } });
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockClear();
    mockCapture.mockResolvedValue({ id: 'PP-AMOUNT', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ status: 'COMPLETED', amount: { value: '1.00', currency_code: 'USD' } }] } }] });
    const { approvePayPalOrder } = await import('@/lib/actions/order.actions');
    expect((await approvePayPalOrder(id, { orderID: 'PP-AMOUNT' })).success).toBe(false);
    const row = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(row.paymentNote).toContain('OWNER NOTE keep me');
    expect(row.paymentNote).toContain('CAPTURE_REQUESTED');
    expect(row.paymentNote).toContain('AMOUNT_MISMATCH');
    await approvePayPalOrder(id, { orderID: 'PP-AMOUNT' });
    expect(mockCapture).toHaveBeenCalledTimes(1);
  });

  const respond = (captures: unknown, orderStatus = 'COMPLETED', id = 'PP-X') => ({
    id,
    status: orderStatus,
    payer: { email_address: 'payer-secret@example.test' },
    purchase_units: [{ payments: captures === undefined ? {} : { captures } }],
  });
  const approveWith = async (ppId: string, resp: unknown) => {
    const id = await mkOrder(ppId);
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCapture.mockResolvedValueOnce(resp);
    const { approvePayPalOrder } = await import('@/lib/actions/order.actions');
    const r = await approvePayPalOrder(id, { orderID: ppId });
    const { prisma } = await import('@/db/prisma');
    const o = await prisma.order.findUnique({ where: { id }, select: { isPaid: true, paymentNote: true } });
    return { r, o };
  };

  test('capture PENDING (eCheck): marker, never "rejected" or "paid", payer email not leaked', async () => {
    const { r, o } = await approveWith('PP-PEND', respond([{ status: 'PENDING', status_details: { reason: 'ECHECK' }, amount: { value: '5.00', currency_code: 'USD' } }], 'COMPLETED', 'PP-PEND'));
    expect(r.success).toBe(false);
    expect(r.message).toContain('pending with PayPal');
    expect(r.message).not.toMatch(/declined|rejected|did not complete|payer-secret/i);
    expect(o?.isPaid).toBe(false);
    expect(o?.paymentNote).toContain('CAPTURE_PENDING reason=ECHECK');
    expect(o?.paymentNote).not.toContain('payer-secret');
  });

  test('capture DECLINED / FAILED: definite not-paid message, no marker', async () => {
    for (const st of ['DECLINED', 'FAILED']) {
      const { r, o } = await approveWith(`PP-${st}`, respond([{ status: st, amount: { value: '5.00', currency_code: 'USD' } }], 'COMPLETED', `PP-${st}`));
      expect(r.message).toBe('PayPal did not complete the payment.');
      expect(o?.paymentNote).toContain('CAPTURE_REQUESTED');
    }
  });

  test('order COMPLETED but no capture data, or an unexpected capture state: UNCONFIRMED, never paid', async () => {
    const a = await approveWith('PP-NOCAP', respond(undefined, 'COMPLETED', 'PP-NOCAP'));
    expect(a.o?.isPaid).toBe(false);
    expect(a.o?.paymentNote).toContain('CAPTURE_UNCONFIRMED reason=NO_CAPTURE_DATA');
    const b = await approveWith('PP-REFD', respond([{ status: 'REFUNDED', amount: { value: '5.00', currency_code: 'USD' } }], 'COMPLETED', 'PP-REFD'));
    expect(b.o?.isPaid).toBe(false);
    expect(b.o?.paymentNote).toContain('CAPTURE_UNCONFIRMED reason=UNEXPECTED_CAPTURE_STATE');
    expect(a.r.message).toContain('could not confirm');
  });

  test('response for a different PayPal order id: UNCONFIRMED (ORDER_ID_MISMATCH), never paid', async () => {
    const { o } = await approveWith('PP-IDA', respond([{ status: 'COMPLETED', amount: { value: '5.00', currency_code: 'USD' } }], 'COMPLETED', 'PP-OTHER'));
    expect(o?.isPaid).toBe(false);
    expect(o?.paymentNote).toContain('CAPTURE_UNCONFIRMED reason=ORDER_ID_MISMATCH');
  });

  test('order not COMPLETED and no capture (e.g. APPROVED): unknown, never a rejection claim', async () => {
    const { r, o } = await approveWith('PP-APPR', respond(undefined, 'APPROVED', 'PP-APPR'));
    expect(r.message).toContain('could not confirm');
    expect(o?.paymentNote).toContain('CAPTURE_UNCONFIRMED reason=INCOMPLETE_CAPTURE_DATA');
  });

  test('empty response is unknown, never a rejection claim', async () => {
    const { r, o } = await approveWith('PP-EMPTY', null);
    expect(r.success).toBe(false);
    expect(r.message).toContain('could not confirm');
    expect(o?.isPaid).toBe(false);
    expect(o?.paymentNote).toContain('CAPTURE_UNCONFIRMED reason=NO_RESPONSE_DATA');
  });

  test('creation stores the API instance environment on the local order', async () => {
    const id = await mkOrder('PP-BEFORE');
    const { prisma: setupDb } = await import('@/db/prisma');
    const { Prisma } = await import('@prisma/client');
    await setupDb.order.update({ where: { id }, data: { paymentResult: Prisma.DbNull } });
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    mockCreate.mockResolvedValueOnce({ id: 'PP-CREATED' });
    const { createPayPalOrder } = await import('@/lib/actions/order.actions');
    const r = await createPayPalOrder(id);
    const { prisma } = await import('@/db/prisma');
    expect(r.success).toBe(true);
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order.paymentResult).toMatchObject({ id: 'PP-CREATED', paypalEnv: 'sandbox' });
  });
});
