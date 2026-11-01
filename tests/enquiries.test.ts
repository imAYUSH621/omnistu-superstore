// jest globals are used so jest.mock hoists above the imports

const create = jest.fn();
jest.mock('@/db/prisma', () => ({
  prisma: { serviceEnquiry: { create: (a: unknown) => create(a) } },
  databaseConfigured: true,
}));
const dbMock = jest.requireMock('@/db/prisma') as { databaseConfigured: boolean };

import { POST } from '@/app/api/enquiries/route';
import { validateEnquiry, rateLimited } from '@/lib/enquiries';

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
    expect(create.mock.calls[0][0]).toEqual({ data: { name: 'Asha Rao', email: 'asha@example.com', message: 'Need a website for my shop.', serviceSlug: 'websites' } });
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
