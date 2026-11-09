import {localDatabaseTestEnabled} from './helpers/local-database';
/**
 * Real Postgres test of the CAPTURED_UNSETTLED recorder (note kept, incident appended, idempotent,
 * paid orders untouched). Needs a disposable DATABASE_URL; skipped otherwise. No provider calls.
 */
const RUN = localDatabaseTestEnabled();

(RUN ? describe : describe.skip)('recordCapturedUnsettled (real DB)', () => {
  const email = `unsettled-${Date.now()}@example.test`;
  const ids: string[] = [];
  let userId = '';
  const mk = async (data: Record<string, unknown>) => {
    const { prisma } = await import('@/db/prisma');
    const o = await prisma.order.create({
      data: {
        userId,
        shippingAddress: {},
        paymentMethod: 'PayPal',
        itemsPrice: 1,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: 1,
        ...data,
      } as never,
    });
    ids.push(o.id);
    return o.id;
  };
  const note = async (id: string) => {
    const { prisma } = await import('@/db/prisma');
    return (await prisma.order.findUnique({ where: { id }, select: { paymentNote: true } }))?.paymentNote ?? null;
  };

  beforeAll(async () => {
    const { prisma } = await import('@/db/prisma');
    userId = (await prisma.user.create({ data: { name: 'Unsettled Tester', email, password: 'x' } })).id;
  });
  afterAll(async () => {
    const { prisma } = await import('@/db/prisma');
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { email } });
  });

  test('empty note: incident recorded with a bounded reason code', async () => {
    const { recordCapturedUnsettled } = await import('@/lib/captured-unsettled');
    const id = await mk({});
    await recordCapturedUnsettled(id, 'CAPX1', '1.00', Object.assign(new Error('boom host=10.0.0.5'), { code: 'P2002' }));
    const n = await note(id);
    expect(n).toContain('CAPTURED_UNSETTLED reason=DB_ERROR capture=CAPX1');
    expect(n).not.toContain('10.0.0.5');
  });

  test('existing AMOUNT_MISMATCH note is preserved and the incident is appended', async () => {
    const { recordCapturedUnsettled } = await import('@/lib/captured-unsettled');
    const id = await mk({ paymentNote: 'AMOUNT_MISMATCH: captured 2.00, expected 1.00' });
    await recordCapturedUnsettled(id, 'CAPX2', '2.00', new Error('x'));
    const n = await note(id);
    expect(n).toContain('AMOUNT_MISMATCH: captured 2.00, expected 1.00');
    expect(n).toContain('CAPTURED_UNSETTLED reason=UNKNOWN capture=CAPX2');
  });

  test('recording twice for the same capture does not duplicate', async () => {
    const { recordCapturedUnsettled } = await import('@/lib/captured-unsettled');
    const id = await mk({});
    await recordCapturedUnsettled(id, 'CAPX3', '1.00', new Error('x'));
    const once = await note(id);
    await recordCapturedUnsettled(id, 'CAPX3', '1.00', new Error('x'));
    expect(await note(id)).toBe(once);
  });

  test('a very long existing note is preserved in full', async () => {
    const { recordCapturedUnsettled } = await import('@/lib/captured-unsettled');
    const long = 'OWNER NOTE ' + 'x'.repeat(5000);
    const id = await mk({ paymentNote: long });
    await recordCapturedUnsettled(id, 'CAPX5', '1.00', new Error('x'));
    const n = (await note(id)) ?? '';
    expect(n.startsWith(long)).toBe(true);
    expect(n).toContain('CAPTURED_UNSETTLED reason=UNKNOWN capture=CAPX5');
  });

  test('a paid order is never touched', async () => {
    const { recordCapturedUnsettled } = await import('@/lib/captured-unsettled');
    const id = await mk({ isPaid: true, paidAt: new Date() });
    await recordCapturedUnsettled(id, 'CAPX4', '1.00', new Error('x'));
    expect(await note(id)).toBeNull();
  });

  test('the admin query shape finds appended and plain incidents', async () => {
    const { prisma } = await import('@/db/prisma');
    const rows = await prisma.order.findMany({
      where: { id: { in: ids }, isPaid: false, OR: [{ paymentNote: { contains: 'CAPTURED_UNSETTLED' } }, { paymentNote: { contains: 'AMOUNT_MISMATCH' } }] },
      select: { id: true },
    });
    expect(rows.length).toBe(4);
  });
});
