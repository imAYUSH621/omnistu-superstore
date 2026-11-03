// Sign-in gate: production fails CLOSED when the limiter store is broken;
// non-production keeps the documented fail-open; untrusted runtimes degrade
// explicitly, never via a shared 'unknown' bucket.
import { limiterBlocksSignin, signinClientIp } from '@/lib/auth-limits';

describe('limiterBlocksSignin', () => {
  it('blocks when the store is unavailable in production (fail closed)', () => {
    expect(limiterBlocksSignin({ allowed: true, available: false }, 'production')).toBe(true);
  });
  it('fails open when the store is unavailable outside production', () => {
    expect(limiterBlocksSignin({ allowed: true, available: false }, 'development')).toBe(false);
    expect(limiterBlocksSignin({ allowed: true, available: false }, 'test')).toBe(false);
  });
  it('blocks over-limit attempts and allows within-limit ones when available', () => {
    expect(limiterBlocksSignin({ allowed: false, available: true }, 'production')).toBe(true);
    expect(limiterBlocksSignin({ allowed: false, available: true }, 'development')).toBe(true);
    expect(limiterBlocksSignin({ allowed: true, available: true }, 'production')).toBe(false);
  });
});

describe('signinClientIp', () => {
  const req = (v: string | null) =>
    ({ headers: { get: () => v } } as unknown as Request);
  it('takes the first value of x-forwarded-for (Vercel-overwritten header)', () => {
    expect(signinClientIp(req('203.0.113.7'), 'production')).toBe('203.0.113.7');
    expect(signinClientIp(req('203.0.113.7, 10.0.0.1'), 'production')).toBe('203.0.113.7');
  });
  it('returns null without the header (local/dev and untrusted runtimes) - no shared bucket', () => {
    expect(signinClientIp(req(null), 'development')).toBeNull();
    expect(signinClientIp(req(null), 'production')).toBeNull();
    expect(signinClientIp(req('   '), 'production')).toBeNull();
    expect(signinClientIp(undefined, 'production')).toBeNull();
  });
});
