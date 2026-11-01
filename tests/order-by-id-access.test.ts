jest.mock('@/auth', () => ({ auth: jest.fn(async () => null) }));
const findFirst = jest.fn();
jest.mock('@/db/prisma', () => ({ prisma: { order: { findFirst: (...a: unknown[]) => findFirst(...a) } } }));
jest.mock('next/navigation', () => ({ redirect: (u: string) => { throw new Error(`REDIRECT:${u}`); } }));

import { auth } from '@/auth';
import { getOrderById } from '@/lib/actions/order.actions';

const ID = '123e4567-e89b-42d3-a456-426614174000';
const order = { id: ID, userId: 'owner-1', orderitems: [], user: { name: 'N', email: 'n@example.test' }, totalPrice: '1.00' };
const as = (u: unknown) => (auth as jest.Mock).mockResolvedValue(u);

beforeEach(() => { findFirst.mockReset(); findFirst.mockResolvedValue(order); });

it('owner gets the order', async () => {
  as({ user: { id: 'owner-1', role: 'user' } });
  expect((await getOrderById(ID))?.id).toBe(ID);
});
it('admin gets the order', async () => {
  as({ user: { id: 'admin-1', role: 'admin' } });
  expect((await getOrderById(ID))?.id).toBe(ID);
});
it('another signed-in user gets null, same as a missing order', async () => {
  as({ user: { id: 'other-1', role: 'user' } });
  expect(await getOrderById(ID)).toBeNull();
  findFirst.mockResolvedValue(null);
  expect(await getOrderById(ID)).toBeNull();
});
it('anonymous gets null and the database is not read', async () => {
  as(null);
  expect(await getOrderById(ID)).toBeNull();
  expect(findFirst).not.toHaveBeenCalled();
});
