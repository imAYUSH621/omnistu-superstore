// jest globals are used so jest.mock hoists above the imports

const create = jest.fn();
jest.mock('@/db/prisma', () => ({
  prisma: { serviceEnquiry: { create: (a: unknown) => create(a) } },
  databaseConfigured: true,
}));
const mockAuth = jest.fn();
jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }));
const dbMock = jest.requireMock('@/db/prisma') as { databaseConfigured: boolean };

import { POST } from '@/app/api/enquiries/route';
import { validateEnquiry, rateLimited, listEnquiriesForUser } from '@/lib/enquiries';

const good = { name: 'Asha Rao', email: 'asha@example.com', message: 'Need a website for my shop.', serviceSlug: 'websites' };
let n = 0;
const req = (body: unknown, ip?: string) =>
  new Request('http://localhost/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip ?? `10.0.0.${++n}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({});
  mockAuth.mockReset();
  mockAuth.mockResolvedValue(null);
  dbMock.databaseConfigured = true;
});

describe('validateEnquiry', () => {
  test('accepts a valid enquiry and trims', () => {
    const r = validateEnquiry({ ...good, name: '  Asha Rao ' });
    expect(r.ok && r.value.name).toBe('Asha Rao');
  });
  test('rejects bad fields and unknown service slug', () => {
    expect(validateEnquiry({ ...good, name: 'A' }).ok).toBe(false);
    expect(validateEnquiry({ ...good, email: 'nope' }).ok).toBe(false);
    expect(validateEnquiry({ ...good, message: 'short' }).ok).toBe(false);
    expect(validateEnquiry({ ...good, serviceSlug: 'invented-service' }).ok).toBe(false);
    expect(validateEnquiry(null).ok).toBe(false);
  });
  test('service slug is optional', () => {
    const r = validateEnquiry({ ...good, serviceSlug: undefined });
    expect(r.ok && r.value.serviceSlug).toBeNull();
  });
});

describe('POST /api/enquiries', () => {
  test('saves a valid enquiry and reports success only after the save', async () => {
    const res = await POST(req(good));
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toEqual({ data: { name: 'Asha Rao', email: 'asha@example.com', message: 'Need a website for my shop.', serviceSlug: 'websites', userId: null } });
  });
  test('invalid JSON and invalid fields are 400 and nothing is saved', async () => {
    expect((await POST(req('{bad'))).status).toBe(400);
    expect((await POST(req({ ...good, email: 'x' }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
  test('no database configured gives honest 503, never fake success', async () => {
    dbMock.databaseConfigured = false;
    const res = await POST(req(good));
    expect(res.status).toBe(503);
    expect((await res.json()).success).toBe(false);
  });
  test('a failed save is 502, not success', async () => {
    create.mockRejectedValue(new Error('db down'));
    const res = await POST(req(good));
    expect(res.status).toBe(502);
  });
  test('honeypot is not saved', async () => {
    const res = await POST(req({ ...good, website: 'http://spam' }));
    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });
  test('6th request from one IP in the window is 429', async () => {
    for (let i = 0; i < 5; i++) expect((await POST(req(good, '9.9.9.9'))).status).toBe(200);
    expect((await POST(req(good, '9.9.9.9'))).status).toBe(429);
  });
});

test('rateLimited window expires', () => {
  for (let i = 0; i < 5; i++) expect(rateLimited('k', 1000)).toBe(false);
  expect(rateLimited('k', 1001)).toBe(true);
  expect(rateLimited('k', 1000 + 10 * 60 * 1000 + 5)).toBe(false);
});

describe('account link (same-origin session only)', () => {
  test('signed-in visitor: enquiry is linked to their id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'user' } });
    await POST(req(good));
    expect((create.mock.calls[0][0] as { data: { userId: string } }).data.userId).toBe('u-1');
  });
  test('guest stays a guest even if the email matches an existing account', async () => {
    await POST(req({ ...good, email: 'user@example.com' }));
    expect((create.mock.calls[0][0] as { data: { userId: unknown } }).data.userId).toBeNull();
  });
  test('client-supplied userId is ignored', async () => {
    await POST(req({ ...good, userId: 'someone-else' }));
    expect((create.mock.calls[0][0] as { data: { userId: unknown } }).data.userId).toBeNull();
  });
  test('session lookup failure degrades to a guest enquiry, still saved', async () => {
    mockAuth.mockRejectedValue(new Error('auth down'));
    const res = await POST(req(good));
    expect(res.status).toBe(200);
    expect((create.mock.calls[0][0] as { data: { userId: unknown } }).data.userId).toBeNull();
  });
});

describe('listEnquiriesForUser', () => {
  test('always filters by the user id and never by email', async () => {
    const fm = jest.fn(async () => []);
    await listEnquiriesForUser(fm as never, 'u-1');
    expect((fm.mock.calls[0] as unknown as [{ where: unknown }])[0].where).toEqual({ userId: 'u-1' });
  });
  test('no user id means no query and an empty list', async () => {
    const fm = jest.fn(async () => []);
    expect(await listEnquiriesForUser(fm as never, undefined)).toEqual([]);
    expect(fm).not.toHaveBeenCalled();
  });
});
