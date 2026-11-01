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
  resetRequest: { max: 3, windowSec: 60 * 60 },
  resetUse: { max: 10, windowSec: 15 * 60 },
  signup: { max: 5, windowSec: 60 * 60 },
} as const;
