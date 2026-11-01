/**
 * Real Postgres test of the reset flow (request, consume, single use, expiry,
 * unknown email). Needs a disposable DATABASE_URL; skipped otherwise.
 * Writes only to a temp dev outbox folder. No mail is sent.
 */
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RUN = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('127.0.0.1');

(RUN ? describe : describe.skip)('password reset (real DB)', () => {
  const email = `reset-${Date.now()}@example.test`;
  const dir = mkdtempSync(join(tmpdir(), 'outbox-'));

  beforeAll(async () => {
    process.env.DEV_OUTBOX_DIR = dir;
    const { prisma } = await import('@/db/prisma');
    const { hashPassword } = await import('@/lib/password');
    await prisma.user.create({ data: { name: 'Reset Tester', email, password: await hashPassword('OldPass!123') } });
  });
  afterAll(async () => {
    const { prisma } = await import('@/db/prisma');
    await prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: 'pwreset:reset-' } } });
    await prisma.user.deleteMany({ where: { email } });
  });

  const lastLinkToken = () => {
    const files = readdirSync(dir).sort();
    const body = JSON.parse(readFileSync(join(dir, files[files.length - 1]), 'utf8')).body as string;
    return decodeURIComponent(body.split('token=')[1]);
  };

  it('unknown email creates nothing and writes nothing', async () => {
    const { requestPasswordReset } = await import('@/lib/password-reset');
    await requestPasswordReset('nobody-' + email, 'http://localhost:3000');
    expect(readdirSync(dir)).toHaveLength(0);
  });

  it('request then consume changes the password once; the token cannot be reused', async () => {
    const { requestPasswordReset, consumePasswordReset } = await import('@/lib/password-reset');
    const { prisma } = await import('@/db/prisma');
    const { verifyPassword } = await import('@/lib/password');
    await requestPasswordReset(email, 'http://localhost:3000');
    const raw = lastLinkToken();
    const stored = await prisma.verificationToken.findMany({ where: { identifier: `pwreset:${email}` } });
    expect(stored).toHaveLength(1);
    expect(stored[0].token).not.toBe(raw);
    expect(await consumePasswordReset(raw, 'NewPass!456')).toEqual({ ok: true });
    const u = await prisma.user.findUnique({ where: { email } });
    expect((await verifyPassword('NewPass!456', u?.password ?? '')).ok).toBe(true);
    expect(await consumePasswordReset(raw, 'Again!789')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('an expired token is refused and the password is unchanged', async () => {
    const { requestPasswordReset, consumePasswordReset } = await import('@/lib/password-reset');
    const { prisma } = await import('@/db/prisma');
    const { verifyPassword } = await import('@/lib/password');
    await requestPasswordReset(email, 'http://localhost:3000');
    const raw = lastLinkToken();
    await prisma.verificationToken.updateMany({ where: { identifier: `pwreset:${email}` }, data: { expires: new Date(Date.now() - 1000) } });
    expect(await consumePasswordReset(raw, 'Late!000')).toEqual({ ok: false, reason: 'expired' });
    const u = await prisma.user.findUnique({ where: { email } });
    expect((await verifyPassword('NewPass!456', u?.password ?? '')).ok).toBe(true);
  });

  it('a garbage token is refused', async () => {
    const { consumePasswordReset } = await import('@/lib/password-reset');
    expect(await consumePasswordReset('nope', 'x123456')).toEqual({ ok: false, reason: 'invalid' });
  });
});
