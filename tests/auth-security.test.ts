import {
  isDevBypassEnabled,
  checkDevBypassCredentials,
} from '@/lib/dev-admin-bypass';

describe('dev admin bypass gating (auth hardening)', () => {
  const base = {
    NODE_ENV: 'development',
    DEV_ADMIN_BYPASS: 'true',
    DEV_ADMIN_PASSWORD: 'a-long-enough-dev-password',
  };

  it('is disabled in production even when explicitly requested', () => {
    expect(isDevBypassEnabled({ ...base, NODE_ENV: 'production' })).toBe(false);
    expect(
      checkDevBypassCredentials('admin@example.com', base.DEV_ADMIN_PASSWORD, {
        ...base,
        NODE_ENV: 'production',
      })
    ).toBe(false);
  });

  it('is disabled unless DEV_ADMIN_BYPASS is exactly "true"', () => {
    expect(isDevBypassEnabled({ ...base, DEV_ADMIN_BYPASS: '1' })).toBe(false);
    expect(isDevBypassEnabled({ ...base, DEV_ADMIN_BYPASS: undefined })).toBe(false);
  });

  it('rejects short or missing dev passwords', () => {
    expect(isDevBypassEnabled({ ...base, DEV_ADMIN_PASSWORD: '123456' })).toBe(false);
    expect(isDevBypassEnabled({ ...base, DEV_ADMIN_PASSWORD: undefined })).toBe(false);
  });

  it('accepts only the configured email and password', () => {
    expect(checkDevBypassCredentials('admin@example.com', base.DEV_ADMIN_PASSWORD, base)).toBe(true);
    expect(checkDevBypassCredentials('admin@example.com', 'wrong-password', base)).toBe(false);
    expect(checkDevBypassCredentials('admin', base.DEV_ADMIN_PASSWORD, base)).toBe(false);
    expect(
      checkDevBypassCredentials('root@example.com', base.DEV_ADMIN_PASSWORD, {
        ...base,
        DEV_ADMIN_EMAIL: 'root@example.com',
      })
    ).toBe(true);
  });
});

describe('source hygiene', () => {
  it('auth.ts contains no hardcoded credential lists', () => {
    const fs = require('fs');
    const src = fs.readFileSync('auth.ts', 'utf8');
    expect(src).not.toMatch(/validAdminPasswords/);
    expect(src).not.toMatch(/'123456'|"123456"/);
    expect(src).not.toMatch(/Admin@Omnistu/);
  });

  it('sample seed data contains no plaintext passwords', () => {
    const fs = require('fs');
    const src = fs.readFileSync('db/sample-data.ts', 'utf8');
    expect(src).not.toMatch(/password:\s*'[^']+'/);
  });
});

import { signUpFormSchema } from '@/lib/validators';

describe('sign-up email normalisation', () => {
  const base = { name: 'Asha Rao', password: 'secret123', confirmPassword: 'secret123' };
  it('trims and lowercases so sign-in (which lowercases) can find the account', () => {
    const r = signUpFormSchema.parse({ ...base, email: '  Asha@Example.COM ' });
    expect(r.email).toBe('asha@example.com');
  });
  it('still rejects invalid emails', () => {
    expect(signUpFormSchema.safeParse({ ...base, email: 'nope' }).success).toBe(false);
  });
});
