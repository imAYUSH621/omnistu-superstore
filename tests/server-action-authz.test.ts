jest.mock('@/auth', () => ({ auth: jest.fn(async () => null) }));
jest.mock('@/db/prisma', () => ({ prisma: new Proxy({}, { get: () => { throw new Error('database must not be reached without an admin session'); } }) }));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));

import { auth } from '@/auth';
import { getOrderSummary, getAllOrders, deleteOrder, getOrderById } from '@/lib/actions/order.actions';
import { deleteProduct, createProduct, updateProduct } from '@/lib/actions/product.actions';
import { getAllUsers, deleteUser, updateUser } from '@/lib/actions/user.actions';
import { GET as supplierHealth } from '@/app/api/supplier-health/route';
import { GET as analytics } from '@/app/api/analytics/route';

const asUser = () => (auth as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'user' } });
const asNobody = () => (auth as jest.Mock).mockResolvedValue(null);

const calls: [string, () => Promise<unknown>][] = [
  ['getOrderSummary', () => getOrderSummary()],
  ['getAllOrders', () => getAllOrders({ page: 1 } as never)],
  ['deleteOrder', () => deleteOrder('x')],
  ['deleteProduct', () => deleteProduct('x')],
  ['createProduct', () => createProduct({} as never)],
  ['updateProduct', () => updateProduct({} as never)],
  ['getAllUsers', () => getAllUsers({ page: 1, query: '' } as never)],
  ['deleteUser', () => deleteUser('x')],
  ['updateUser', () => updateUser({} as never)],
];

describe.each([['anonymous', asNobody], ['signed-in non-admin', asUser]])('admin server actions for %s', (_n, setup) => {
  beforeEach(() => setup());
  it.each(calls)('%s is refused before touching data', async (_name, run) => {
    await expect(run()).rejects.toThrow(/REDIRECT:\/unauthorized/);
  });
});

describe('admin-only API routes', () => {
  it.each([['supplier-health', supplierHealth], ['analytics', analytics]])('%s returns 401 without an admin session', async (_n, get) => {
    asUser();
    expect((await (get as () => Promise<Response>)()).status).toBe(401);
    asNobody();
    expect((await (get as () => Promise<Response>)()).status).toBe(401);
  });
});

it('updateOrderToPaid is not exported from a server-action file', () => {
  const fs = require('node:fs');
  const actions = fs.readFileSync('lib/actions/order.actions.ts', 'utf8');
  expect(actions).toMatch(/^'use server'/);
  expect(actions).not.toMatch(/export (async )?function updateOrderToPaid\(/);
  const settle = fs.readFileSync('lib/order-settlement.ts', 'utf8');
  expect(settle).not.toMatch(/^['"]use server['"]/m);
});

describe('getOrderById (callable as a server action)', () => {
  const ID = '123e4567-e89b-42d3-a456-426614174000';
  it('returns null for a non-UUID id without touching the database or the session', async () => {
    asUser();
    expect(await getOrderById('not-an-id')).toBeNull();
    expect(await getOrderById('')).toBeNull();
  });
  it('returns null for an anonymous caller before touching the database', async () => {
    asNobody();
    expect(await getOrderById(ID)).toBeNull();
  });
});
