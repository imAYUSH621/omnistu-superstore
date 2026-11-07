import { prisma } from '@/db/prisma';

// Per-user session version. A JWT carries the version it was issued with;
// bumping the stored version (password change) makes older tokens invalid the
// next time auth() runs on the server. Guarded raw SQL: without the table
// (migration not applied) development can use version 0;production must refuse.

export async function getSessionVersion(userId: string): Promise<number> {
  try {
    if (process.env.NODE_ENV === 'production') {
      const rows = await prisma.$queryRaw<{ version: number }[]>`
        SELECT COALESCE(v."version", 0) AS "version" FROM "User" u
        LEFT JOIN "UserSessionVersion" v ON v."userId" = u.id
        WHERE u.id = ${userId}::uuid`;
      if (rows.length !== 1 || !Number.isSafeInteger(rows[0].version) || rows[0].version < 0) {
        throw new Error('Session identity unavailable');
      }
      return rows[0].version;
    }
    const rows = await prisma.$queryRaw<{ version: number }[]>`
      SELECT "version" FROM "UserSessionVersion" WHERE "userId" = ${userId}::uuid`;
    return rows[0]?.version ?? 0;
  } catch {
    if (process.env.NODE_ENV === 'production') throw new Error('Session verification unavailable');
    return 0;
  }
}

/** Returns true if the bump was stored (false when the table is missing). */
export async function bumpSessionVersion(userId: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "UserSessionVersion" ("userId","version") VALUES (${userId}::uuid, 1)
      ON CONFLICT ("userId") DO UPDATE SET "version" = "UserSessionVersion"."version" + 1, "updatedAt" = now()`;
    return true;
  } catch {
    return false;
  }
}
