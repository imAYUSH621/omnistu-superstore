import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { devOutboxEnabled, writeDevOutbox } from '@/lib/dev-outbox';
import { hashResetToken, newResetToken, resetIdentifier } from '@/lib/password-reset';

jest.mock('@/db/prisma', () => ({ prisma: {} }));

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe('dev outbox gating', () => {
  it('is off in production even if a folder is configured', () => {
    expect(devOutboxEnabled(env({ NODE_ENV: 'production', DEV_OUTBOX_DIR: '/tmp/x' }))).toBe(false);
    expect(writeDevOutbox({ to: 'a@b.test', subject: 's', body: 'b' }, env({ NODE_ENV: 'production', DEV_OUTBOX_DIR: '/tmp/x' }))).toBe(false);
  });
  it('is off without a configured folder', () => {
    expect(devOutboxEnabled(env({ NODE_ENV: 'development' }))).toBe(false);
  });
  it('writes a private file outside production when configured', () => {
    const dir = mkdtempSync(join(tmpdir(), 'outbox-'));
    const ok = writeDevOutbox({ to: 'a@b.test', subject: 's', body: 'link' }, env({ NODE_ENV: 'test', DEV_OUTBOX_DIR: dir }));
    expect(ok).toBe(true);
    const files = readdirSync(dir);
    expect(files).toHaveLength(1);
    expect(statSync(join(dir, files[0])).mode & 0o077).toBe(0);
    expect(JSON.parse(readFileSync(join(dir, files[0]), 'utf8')).to).toBe('a@b.test');
  });
});

describe('reset token helpers', () => {
  it('makes unguessable distinct tokens and stores only a hash', () => {
    const a = newResetToken();
    const b = newResetToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashResetToken(a)).not.toContain(a);
    expect(hashResetToken(a)).toHaveLength(64);
  });
  it('normalises the identifier', () => {
    expect(resetIdentifier(' A@B.Test ')).toBe('pwreset:a@b.test');
  });
  it('no page or component can read or write outbox files (pages only ask whether it is enabled)', () => {
    const { execSync } = require('node:child_process');
    const hits = execSync("grep -rl 'writeDevOutbox\\|DEV_OUTBOX_DIR\\|readdirSync' app components 2>/dev/null || true", { cwd: process.cwd() }).toString().trim();
    expect(hits).toBe('');
  });
});

describe('requestPasswordReset without an outbox', () => {
  it('creates no token when nothing can deliver the link', async () => {
    const create = jest.fn();
    const find = jest.fn();
    jest.resetModules();
    jest.doMock('@/db/prisma', () => ({ prisma: { user: { findUnique: find }, verificationToken: { create, deleteMany: jest.fn() } } }));
    const saved = process.env.DEV_OUTBOX_DIR;
    delete process.env.DEV_OUTBOX_DIR;
    const { requestPasswordReset } = await import('@/lib/password-reset');
    await requestPasswordReset('a@b.test', 'http://localhost:3000');
    expect(find).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    if (saved) process.env.DEV_OUTBOX_DIR = saved;
  });
});
