export type DbStatus = 'ok' | 'not_configured' | 'down' | 'schema_incomplete';

type Query = <T = unknown>(sql: TemplateStringsArray, ...v: unknown[]) => Promise<T>;

/**
 * Classifies the database without exposing counts, names or connection data.
 * not_configured: DATABASE_URL was never set (the app would silently fall
 *   back to localhost, which cannot exist on a serverless host).
 * down: cannot connect / query.
 * schema_incomplete: reachable, but core tables are missing or a Prisma
 *   migration is recorded as failed (e.g. migrations were never applied).
 */
export async function classifyDatabase(
  configured: boolean,
  query: Query
): Promise<DbStatus> {
  if (!configured) return 'not_configured';
  try {
    await query`SELECT 1`;
  } catch {
    return 'down';
  }
  try {
    const rows = await query<{ order_t: string | null; user_t: string | null; failed: bigint | number | null }[]>`
      SELECT to_regclass('"Order"')::text AS order_t,
             to_regclass('"User"')::text AS user_t,
             CASE WHEN to_regclass('_prisma_migrations') IS NULL THEN NULL
                  ELSE (SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL) END AS failed`;
    const r = rows[0];
    if (!r || !r.order_t || !r.user_t) return 'schema_incomplete';
    if (r.failed !== null && Number(r.failed) > 0) return 'schema_incomplete';
    return 'ok';
  } catch {
    return 'schema_incomplete';
  }
}
