import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveMailTransport, smtpConfigured } from '@/lib/mail/transport';

jest.mock('@/db/prisma', () => ({ prisma: {} }));

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;
const SMTP = { SMTP_HOST: 'smtp.gmail.com', SMTP_PORT: '587', SMTP_USER: 'u@x.test', SMTP_PASS: 'secret' };

describe('resolveMailTransport gating', () => {
  it('is null when nothing is configured (production today)', () => {
    expect(resolveMailTransport(env({ NODE_ENV: 'production' }))).toBeNull();
    expect(resolveMailTransport(env({ NODE_ENV: 'development' }))).toBeNull();
  });
  it('dev outbox stays off in production even with a folder set', () => {
    expect(resolveMailTransport(env({ NODE_ENV: 'production', DEV_OUTBOX_DIR: '/tmp/x' }))).toBeNull();
  });
  it('dev outbox is the development fallback', () => {
    const t = resolveMailTransport(env({ NODE_ENV: 'test', DEV_OUTBOX_DIR: mkdtempSync(join(tmpdir(), 'ob-')) }));
    expect(t?.kind).toBe('dev-outbox');
  });
  it('requires the full SMTP triple (host, user, pass)', () => {
    expect(smtpConfigured(env({ SMTP_HOST: 'h' }))).toBe(false);
    expect(smtpConfigured(env({ SMTP_HOST: 'h', SMTP_USER: 'u' }))).toBe(false);
    expect(smtpConfigured(env(SMTP))).toBe(true);
  });
  it('SMTP wins when both SMTP and the outbox are configured, including in production', () => {
    const t = resolveMailTransport(env({ NODE_ENV: 'production', DEV_OUTBOX_DIR: '/tmp/x', ...SMTP }));
    expect(t?.kind).toBe('smtp');
  });
});

describe('reset mail over a configured transport', () => {
  it('mints the token and sends the link via SMTP when SMTP is configured', async () => {
    const sendMail = jest.fn().mockResolvedValue({ accepted: ['user@x.test'], rejected: [] });
    const create = jest.fn().mockResolvedValue({});
    jest.resetModules();
    jest.doMock('nodemailer', () => ({ createTransport: () => ({ sendMail }) }));
    jest.doMock('@/db/prisma', () => ({
      prisma: {
        user: { findMany: jest.fn().mockResolvedValue([{ id: 'u1', email: 'user@x.test' }]) },
        verificationToken: { create, deleteMany: jest.fn().mockResolvedValue({}) },
      },
    }));
    const saved = { ...process.env };
    process.env = { ...process.env, ...SMTP };
    delete process.env.DEV_OUTBOX_DIR;
    const { requestPasswordReset } = await import('@/lib/password-reset');
    await requestPasswordReset('User@X.test', 'https://omnistu.com/');
    expect(create).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0][0];
    expect(sent.to).toBe('user@x.test');
    expect(sent.subject).toBe('Reset your password');
    expect(sent.text).toMatch(/^https:\/\/omnistu\.com\/reset-password\?token=.+/);
    process.env = saved;
  });

  async function runWith(sendMail: jest.Mock) {
    const create = jest.fn().mockResolvedValue({});
    const deleteMany = jest.fn().mockResolvedValue({});
    jest.resetModules();
    jest.doMock('nodemailer', () => ({ createTransport: () => ({ sendMail }) }));
    jest.doMock('@/db/prisma', () => ({
      prisma: {
        user: { findMany: jest.fn().mockResolvedValue([{ id: 'u1', email: 'user@x.test' }]) },
        verificationToken: { create, deleteMany },
      },
    }));
    const saved = { ...process.env };
    process.env = { ...process.env, ...SMTP };
    delete process.env.DEV_OUTBOX_DIR;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { requestPasswordReset } = await import('@/lib/password-reset');
    const outcome = await requestPasswordReset('user@x.test', 'https://omnistu.com');
    const logged = JSON.stringify(warn.mock.calls);
    warn.mockRestore();
    process.env = saved;
    return { outcome, create, deleteMany, logged };
  }

  it('reports sent only when the server accepted the recipient', async () => {
    const r = await runWith(jest.fn().mockResolvedValue({ accepted: ['user@x.test'], rejected: [] }));
    expect(r.outcome).toBe('sent');
  });

  it('a thrown send is a failure: token revoked, nothing logged but the error name', async () => {
    const err = Object.assign(new Error('auth failed for user@x.test pass secret'), { code: 'EAUTH' });
    const r = await runWith(jest.fn().mockRejectedValue(err));
    expect(r.outcome).toBe('failed');
    expect(r.create).toHaveBeenCalledTimes(1);
    expect(r.deleteMany).toHaveBeenCalledTimes(2); // pre-clean + revoke after failed delivery
    expect(r.logged).not.toContain('secret');
    expect(r.logged).not.toContain('user@x.test');
  });

  it('a rejected recipient or empty accepted list is a failure, not success', async () => {
    expect((await runWith(jest.fn().mockResolvedValue({ accepted: [], rejected: ['user@x.test'] }))).outcome).toBe('failed');
    expect((await runWith(jest.fn().mockResolvedValue({}))).outcome).toBe('failed');
  });

  it('unknown account is skipped and sends nothing', async () => {
    const sendMail = jest.fn();
    jest.resetModules();
    jest.doMock('nodemailer', () => ({ createTransport: () => ({ sendMail }) }));
    jest.doMock('@/db/prisma', () => ({
      prisma: { user: { findMany: jest.fn().mockResolvedValue([]) }, verificationToken: { create: jest.fn(), deleteMany: jest.fn() } },
    }));
    const saved = { ...process.env };
    process.env = { ...process.env, ...SMTP };
    const { requestPasswordReset } = await import('@/lib/password-reset');
    expect(await requestPasswordReset('nobody@x.test', 'https://omnistu.com')).toBe('skipped');
    expect(sendMail).not.toHaveBeenCalled();
    process.env = saved;
  });

  it('still mints no token when no transport exists', async () => {
    const create = jest.fn();
    jest.resetModules();
    jest.doMock('@/db/prisma', () => ({
      prisma: {
        user: { findUnique: jest.fn() },
        verificationToken: { create, deleteMany: jest.fn() },
      },
    }));
    const saved = { ...process.env };
    delete process.env.DEV_OUTBOX_DIR;
    delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASS;
    const { requestPasswordReset } = await import('@/lib/password-reset');
    expect(await requestPasswordReset('a@b.test', 'http://localhost:3000')).toBe('skipped');
    expect(create).not.toHaveBeenCalled();
    process.env = saved;
  });
});
