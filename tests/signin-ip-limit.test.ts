// Per-IP sign-in attempt ceiling: distributed credential stuffing across many
// distinct emails from one address must hit the IP bucket, while other IPs
// and the per-email limit behave independently. Store stays fail-open.

type Row = { kind: string; keyHash: string; createdAt: Date };
const rows: Row[] = [];
jest.mock('@/db/prisma', () => ({
  prisma: {
    $executeRaw: jest.fn(async (strings: TemplateStringsArray, ...vals: unknown[]) => {
      const sql = strings.join('?');
      if (sql.includes('INSERT INTO "AuthAttempt"')) {
        rows.push({ kind: vals[0] as string, keyHash: vals[1] as string, createdAt: new Date() });
      }
      if (sql.includes('DELETE FROM "AuthAttempt"')) {
        const before = rows.length;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (rows[i].keyHash === vals[1] || Date.now() - rows[i].createdAt.getTime() > 86_400_000) rows.splice(i, 1);
        }
        return before - rows.length;
      }
      return 0;
    }),
    $queryRaw: jest.fn(async (strings: TemplateStringsArray, ...vals: unknown[]) => {
      const [kind, keyHash, windowSec] = vals as [string, string, number];
      const n = rows.filter(
        (r) => r.kind === kind && r.keyHash === keyHash && Date.now() - r.createdAt.getTime() < windowSec * 1000
      ).length;
      return [{ n: BigInt(n) }];
    }),
  },
}));

import * as fs from 'fs';
import { hitLimit, limitKey, LIMITS } from '@/lib/auth-limits';

describe('per-IP sign-in ceiling', () => {
  beforeEach(() => { rows.length = 0; });

  it('many distinct emails from one IP exhaust the IP bucket (credential stuffing stops)', async () => {
    const ip = '203.0.113.77';
    let last = { allowed: true, available: true };
    for (let i = 0; i < LIMITS.signinIp.max + 1; i++) {
      // each loop uses a different email key but the SAME ip key
      await hitLimit('signin', `probe-${i}@example.invalid`, LIMITS.signin.max, LIMITS.signin.windowSec);
      last = await hitLimit('signin-ip', ip, LIMITS.signinIp.max, LIMITS.signinIp.windowSec);
    }
    expect(last.allowed).toBe(false);
    expect(last.available).toBe(true);
  });

  it('a different IP is unaffected (no global lockout, NAT fairness for others)', async () => {
    for (let i = 0; i < LIMITS.signinIp.max + 1; i++) {
      await hitLimit('signin-ip', '203.0.113.77', LIMITS.signinIp.max, LIMITS.signinIp.windowSec);
    }
    const other = await hitLimit('signin-ip', '198.51.100.9', LIMITS.signinIp.max, LIMITS.signinIp.windowSec);
    expect(other.allowed).toBe(true);
  });

  it('IP keys are hashed, never stored raw', async () => {
    await hitLimit('signin-ip', '203.0.113.77', LIMITS.signinIp.max, LIMITS.signinIp.windowSec);
    expect(rows[0].keyHash).toBe(limitKey('203.0.113.77'));
    expect(rows[0].keyHash).not.toContain('203.0.113');
    expect(rows[0].keyHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('auth.ts applies the IP limit before any password hashing, from the Vercel-overwritten header only', () => {
    const src = fs.readFileSync('auth.ts', 'utf8');
    expect(src).toContain("headers?.get('x-forwarded-for')");
    expect(src).not.toContain("x-real-ip");
    expect(src).not.toContain('x-vercel-forwarded-for');
    expect(src.indexOf("hitLimit('signin-ip'")).toBeGreaterThan(-1);
    expect(src.indexOf("hitLimit('signin-ip'")).toBeLessThan(src.indexOf('await dummyVerify('));
    expect(src.indexOf("hitLimit('signin-ip'")).toBeLessThan(src.indexOf('await verifyPasswordGated('));
    expect(src).toContain("split(',')[0]");
  });

  it('per-email limit still applies under the IP limit (existing-user lockout unchanged)', () => {
    expect(LIMITS.signin).toEqual({ max: 8, windowSec: 900 });
    expect(LIMITS.signinIp.max).toBeGreaterThan(LIMITS.signin.max);
  });
});
