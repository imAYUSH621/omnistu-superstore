import { createHash } from 'node:crypto';
import { prisma } from '@/db/prisma';

// Database-backed attempt limits, shared by every server instance.
// Uses guarded raw SQL so that a database without the AuthAttempt table
// (migration not applied yet) keeps working, unthrottled.

export type LimitResult = { allowed: boolean; available: boolean };

export function limitKey(raw: string): string {
  return createHash('sha256').update(raw.trim().toLowerCase()).digest('hex');
}

let warned = false;
function unavailable(e: unknown): LimitResult {
  if (!warned) {
    warned = true;
    console.warn('auth limits unavailable (is the AuthAttempt migration applied?)', e instanceof Error ? e.name : 'error');
  }
  return { allowed: true, available: false };
}

/** Records one attempt and says whether it is within `max` per `windowSec`. */
export async function hitLimit(kind: string, key: string, max: number, windowSec: number): Promise<LimitResult> {
  try {
    const keyHash = limitKey(key);
    await prisma.$executeRaw`INSERT INTO "AuthAttempt" ("kind","keyHash") VALUES (${kind}, ${keyHash})`;
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*)::bigint AS n FROM "AuthAttempt"
      WHERE "kind" = ${kind} AND "keyHash" = ${keyHash}
        AND "createdAt" > now() - make_interval(secs => ${windowSec})`;
    const n = Number(rows[0]?.n ?? 0);
    if (Math.random() < 0.02) {
      await prisma.$executeRaw`DELETE FROM "AuthAttempt" WHERE "createdAt" < now() - interval '1 day'`;
    }
    return { allowed: n <= max, available: true };
  } catch (e) {
    return unavailable(e);
  }
}

export async function clearLimit(kind: string, key: string): Promise<void> {
  try {
    await prisma.$executeRaw`DELETE FROM "AuthAttempt" WHERE "kind" = ${kind} AND "keyHash" = ${limitKey(key)}`;
  } catch (e) {
    unavailable(e);
  }
}

export const LIMITS = {
  signin: { max: 8, windowSec: 15 * 60 },
  // Per-IP ceiling: stops distributed credential stuffing across many emails
  // from one address while staying fair to shared NAT (40 per 15 min is far
  // above legitimate human sign-in rates from one network). Keys are hashed.
  signinIp: { max: 40, windowSec: 15 * 60 },
  resetRequest: { max: 3, windowSec: 60 * 60 },
  resetUse: { max: 10, windowSec: 15 * 60 },
  signup: { max: 5, windowSec: 60 * 60 },
} as const;

/**
 * Sign-in gate decision for limiter outcomes. In production a BROKEN limiter
 * store (table missing/permission error) must fail CLOSED: an unmigrated or
 * erroring store otherwise means unthrottled sign-in, the exact regression
 * readiness warns about (auth_tables_missing). In non-production it fails open
 * so local/dev keeps working before migrations run.
 */
export function limiterBlocksSignin(lim: LimitResult, nodeEnv: string | undefined): boolean {
  if (!lim.available) return nodeEnv === 'production';
  return !lim.allowed;
}

let warnedNoIp = false;
/**
 * Client IP for the per-IP sign-in bucket, or null when there is no
 * trustworthy source. On Vercel, x-forwarded-for is overwritten by the edge
 * with the real client IP and external values are not forwarded (official
 * anti-spoofing behaviour). Any other public runtime provides no trustworthy
 * client-IP header here: the IP bucket then stays INACTIVE - an explicit,
 * logged degradation in production, never a shared 'unknown' bucket (which
 * would be a global lockout). If a proxy (e.g. Cloudflare) is ever placed in
 * front of Vercel, this provenance must be revisited: the edge-observed IP
 * becomes the proxy's, and the real client IP moves to a proxy-specific header.
 */
export function signinClientIp(req: Request | undefined, nodeEnv: string | undefined): string | null {
  const fwd = req?.headers?.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0].trim();
  if (ip) return ip;
  if (nodeEnv === 'production' && !warnedNoIp) {
    warnedNoIp = true;
    console.warn('sign-in IP limiter inactive: no trustworthy client-IP header on this runtime');
  }
  return null;
}
