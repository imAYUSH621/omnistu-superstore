process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-only-key-0123456789abcdef';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hash: legacyHash } = require('@/lib/encrypt');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hashPassword, isLegacyHash, verifyPassword } = require('@/lib/password');

describe('password hashing', () => {
  it('uses a salted slow hash: same password gives different values, both verify', async () => {
    const a = await hashPassword('Correct!Horse1');
    const b = await hashPassword('Correct!Horse1');
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$16384$8$1$')).toBe(true);
    expect((await verifyPassword('Correct!Horse1', a)).ok).toBe(true);
    expect((await verifyPassword('Correct!Horse1', b)).needsUpgrade).toBe(false);
  });
  it('rejects a wrong password, an empty hash and malformed hashes', async () => {
    const a = await hashPassword('Correct!Horse1');
    expect((await verifyPassword('wrong', a)).ok).toBe(false);
    expect((await verifyPassword('x', '')).ok).toBe(false);
    expect((await verifyPassword('x', 'scrypt$16384$8$1$')).ok).toBe(false);
    expect((await verifyPassword('x', 'plaintext')).ok).toBe(false);
  });
  it('still verifies an old keyed-digest hash and flags it for upgrade', async () => {
    const old = await legacyHash('OldPass!1');
    expect(isLegacyHash(old)).toBe(true);
    expect(await verifyPassword('OldPass!1', old)).toEqual({ ok: true, needsUpgrade: true });
    expect((await verifyPassword('nope', old)).ok).toBe(false);
  });
  it('flags weaker scrypt parameters for upgrade', async () => {
    const { scryptSync, randomBytes } = await import('node:crypto');
    const salt = randomBytes(16);
    const key = scryptSync('Pw!123456', salt, 64, { N: 1024, r: 8, p: 1 });
    const stored = ['scrypt', 1024, 8, 1, salt.toString('base64'), key.toString('base64')].join('$');
    expect(await verifyPassword('Pw!123456', stored)).toEqual({ ok: true, needsUpgrade: true });
  });
});
