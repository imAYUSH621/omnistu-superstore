jest.mock('@/auth', () => ({ auth: jest.fn(), signIn: jest.fn(), signOut: jest.fn() }));
const findFirst = jest.fn();
jest.mock('@/db/prisma', () => ({ prisma: { user: { findFirst: (...a: unknown[]) => findFirst(...a) } } }));
jest.mock('@/lib/actions/cart.actions', () => ({ getMyCart: jest.fn() }));

import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';

const row = { id: 'u1', name: 'A', email: 'a@b.test', password: 'secret-hash', role: 'user', address: null, paymentMethod: null };
beforeEach(() => { findFirst.mockReset(); findFirst.mockResolvedValue(row); });

it('refuses anonymous callers without querying', async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  await expect(getUserById('u1')).rejects.toThrow('User not found');
  expect(findFirst).not.toHaveBeenCalled();
});
it('refuses another signed-in user', async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { id: 'u2', role: 'user' } });
  await expect(getUserById('u1')).rejects.toThrow('User not found');
  expect(findFirst).not.toHaveBeenCalled();
});
it('returns the owner record without the password hash', async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'user' } });
  const u = await getUserById('u1');
  expect(u.email).toBe('a@b.test');
  expect('password' in u).toBe(false);
});
it('lets an admin read any user, still without the hash', async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { id: 'adm', role: 'admin' } });
  const u = await getUserById('u1');
  expect('password' in u).toBe(false);
});
