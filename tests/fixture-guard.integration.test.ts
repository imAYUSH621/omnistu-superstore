/**
 * REAL Postgres negative tests: fixture rows (fxt-/cjstg-) can never be added to a cart or ordered.
 * No payment provider, no email, no money. Requires REFUND_ITEST_DATABASE_URL = DATABASE_URL (disposable DB).
 */
jest.mock('@/lib/utils', () => ({ ...jest.requireActual('@/lib/utils'), isDatabaseAvailable: () => true }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
const mockAuth = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a), signIn: jest.fn(), signOut: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: async () => ({ get: (k: string) => (k === 'sessionCartId' ? { value: 'sess-fixture-guard' } : undefined) }) }));
jest.mock('@/lib/paypal', () => ({ paypal: { createOrder: jest.fn(async () => { throw new Error('payment must not be reached'); }) } }), { virtual: false });

import { prisma } from '@/db/prisma';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { createOrder } from '@/lib/actions/order.actions';

const DB = process.env.REFUND_ITEST_DATABASE_URL;
const maybe = DB && process.env.DATABASE_URL === DB ? describe : describe.skip;

maybe('fixture guard on REAL Postgres', () => {
  const run = Date.now().toString(36);
  let userId = '';
  let fx = { id: '', slug: '' };
  let real = { id: '', slug: '' };

  beforeAll(async () => {
    const u = await prisma.user.create({ data: { name: 'FG', email: `fg-${run}@example.com`, password: 'x', role: 'user', address: { fullName: 'F G', address: '1 St', city: 'C', postalCode: '1', country: 'US' }, paymentMethod: 'PayPal' } });
    userId = u.id;
    mockAuth.mockResolvedValue({ user: { id: userId, role: 'user' } });
    const mk = (slug: string) => prisma.product.create({ data: { name: slug, slug, category: 'FG', images: ['/x.jpg'], brand: null, description: 'd', stock: 5, price: '10.00' } });
    const a = await mk(`cjstg-fg-${run}`); fx = { id: a.id, slug: a.slug };
    const b = await mk(`fg-real-${run}`); real = { id: b.id, slug: b.slug };
  }, 30000);
  afterAll(async () => {
    await prisma.cart.deleteMany({ where: { userId } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.product.deleteMany({ where: { id: { in: [fx.id, real.id] } } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  }, 30000);

  const item = (p: { id: string; slug: string }) => ({ productId: p.id, name: p.slug, slug: p.slug, qty: 1, image: '/x.jpg', price: '10.00' });

  it('addItemToCart refuses a fixture product and creates no cart', async () => {
    const r = await addItemToCart(item(fx) as never);
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/Test fixture/);
    expect(await prisma.cart.count({ where: { userId } })).toBe(0);
  });
  it('addItemToCart still accepts a normal product (guard is not blanket)', async () => {
    const r = await addItemToCart(item(real) as never);
    expect(r.success).toBe(true);
  });
  it('createOrder refuses a crafted cart that contains a fixture item and creates no order', async () => {
    await prisma.cart.deleteMany({ where: { userId } });
    await prisma.cart.create({ data: { userId, sessionCartId: 'sess-fixture-guard', items: [item(real), item(fx)] as never, itemsPrice: '20.00', totalPrice: '20.00', shippingPrice: '0', taxPrice: '0' } });
    const r = await createOrder();
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/Test fixture/);
    expect(await prisma.order.count({ where: { userId } })).toBe(0);
  });
});
