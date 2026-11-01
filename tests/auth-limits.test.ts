// Unmigrated database: the helpers must not throw, sign-in must keep working.
jest.mock('@/db/prisma', () => {
  const boom = () => Promise.reject(Object.assign(new Error('relation does not exist'), { code: '42P01' }));
  return { prisma: { $executeRaw: boom, $queryRaw: boom } };
});

import { clearLimit, hitLimit, limitKey } from '@/lib/auth-limits';
import { bumpSessionVersion, getSessionVersion } from '@/lib/session-version';

describe('auth limits and session version without their tables', () => {
  it('limits fail open and say they are unavailable', async () => {
    expect(await hitLimit('signin', 'a@b.test', 1, 60)).toEqual({ allowed: true, available: false });
    await expect(clearLimit('signin', 'a@b.test')).resolves.toBeUndefined();
  });
  it('session version reads as 0 and a bump reports not stored', async () => {
    expect(await getSessionVersion('00000000-0000-0000-0000-000000000001')).toBe(0);
    expect(await bumpSessionVersion('00000000-0000-0000-0000-000000000001')).toBe(false);
  });
  it('keys are hashed and case-insensitive', () => {
    expect(limitKey(' A@B.test ')).toBe(limitKey('a@b.test'));
    expect(limitKey('a@b.test')).not.toContain('a@b.test');
  });
});
