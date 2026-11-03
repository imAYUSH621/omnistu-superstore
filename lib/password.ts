import { randomBytes, scrypt as scryptCb, timingSafeEqual, ScryptOptions } from 'node:crypto';
import { hash as legacyHash } from '@/lib/encrypt';

// Node-only (do not import from edge code such as middleware).
// OWASP Password Storage Cheat Sheet (checked 2026-11-03) lists N=2^14 r=8 p=5
// (16 MiB) as one of its minimum scrypt configurations; it fits the 64 MiB
// maxmem budget and measured ~145ms/hash on a dev sandbox CPU. Old p=1 hashes
// still verify (params are stored per-hash) and upgrade on next sign-in.
const N = 16384;
const R = 8;
const P = 5;
const KEYLEN = 64;
const PREFIX = 'scrypt';

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize('NFKC'), salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Salted, slow hash: scrypt$N$r$p$salt$hash (base64). */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(plain, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return [PREFIX, N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export function isLegacyHash(stored: string): boolean {
  return /^[0-9a-f]{64}$/.test(stored);
}

function safeEq(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Checks a password against a stored hash. Old accounts hold a keyed
 * HMAC-SHA256 hex digest: those still verify, and `needsUpgrade` tells the
 * caller to rewrite the stored value with hashPassword after a good sign-in.
 */
export async function verifyPassword(
  plain: string,
  stored: string
): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (!stored) return { ok: false, needsUpgrade: false };
  if (stored.startsWith(`${PREFIX}$`)) {
    const [, n, r, p, saltB64, keyB64] = stored.split('$');
    const expected = Buffer.from(keyB64 ?? '', 'base64');
    if (!saltB64 || expected.length === 0) return { ok: false, needsUpgrade: false };
    const actual = await scrypt(plain, Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    const ok = safeEq(actual, expected);
    return { ok, needsUpgrade: ok && (Number(n) < N || Number(r) < R || Number(p) < P) };
  }
  if (isLegacyHash(stored)) {
    const ok = safeEq(Buffer.from(await legacyHash(plain), 'hex'), Buffer.from(stored, 'hex'));
    return { ok, needsUpgrade: ok };
  }
  return { ok: false, needsUpgrade: false };
}


/** Thrown when too many password checks are already running or waiting. */
export class HashBusyError extends Error {
  constructor() {
    super('hash capacity exceeded');
    this.name = 'HashBusyError';
  }
}

/**
 * Bounded concurrency for slow hashing. Per server instance only (not shared
 * across serverless instances) and not per client: it protects CPU during a
 * flood and makes excess attempts fail fast. It also fails real sign-ins for
 * the length of a flood on that instance.
 */
export function createGate(maxActive: number, maxQueue: number) {
  let active = 0;
  const waiters: Array<() => void> = [];
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= maxActive) {
      if (waiters.length >= maxQueue) throw new HashBusyError();
      await new Promise<void>((resolve) => waiters.push(resolve));
    } else {
      active++;
    }
    try {
      return await fn();
    } finally {
      const next = waiters.shift();
      if (next) next(); // hand the slot over
      else active--;
    }
  };
}

const gate = createGate(4, 32);

/** Verify behind the gate. */
export function verifyPasswordGated(plain: string, stored: string) {
  return gate(() => verifyPassword(plain, stored));
}

// Fixed throwaway salt: used only to spend the same work for accounts that do
// not exist (or have no password) so the response time does not depend on it.
const DUMMY_SALT = Buffer.from('omnistu-dummy-salt-0000000000000');
/** Spends one scrypt verification worth of work and returns nothing useful. */
export function dummyVerify(plain: string): Promise<void> {
  return gate(async () => {
    await scrypt(plain, DUMMY_SALT, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  });
}
