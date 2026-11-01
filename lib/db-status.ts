export type DbStatus = 'ok' | 'not_configured' | 'down' | 'schema_incomplete' | 'auth_tables_missing';

type Query = <T = unknown>(sql: TemplateStringsArray, ...v: unknown[]) => Promise<T>;

/**
 * Classifies the database without exposing counts, names or connection data.
 * not_configured: DATABASE_URL was never set (the app would silently fall
 *   back to localhost, which cannot exist on a serverless host).
 * down: cannot connect / query.
 * auth_tables_missing: core schema fine but the auth limits / session version tables
 *   are absent (migration 20261102003000 not applied): sign-in works unthrottled.
 * schema_incomplete: reachable (the failed-migration check is skipped when the
 *   least-privilege app role cannot read _prisma_migrations), but core tables are missing or a Prisma
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
  let r: { order_t: string | null; user_t: string | null } | undefined;
  try {
    const rows = await query<{ order_t: string | null; user_t: string | null }[]>`
      SELECT to_regclass('"Order"')::text AS order_t, to_regclass('"User"')::text AS user_t`;
    r = rows[0];
  } catch {
    return 'schema_incomplete';
  }
  if (!r || !r.order_t || !r.user_t) return 'schema_incomplete';
  // Separate statement: a least-privilege app role cannot read _prisma_migrations
  // (permission is checked even in an untaken CASE branch), so the failed-migration
  // check is skipped when it is unreadable.
  try {
    const m = await query<{ failed: bigint | number }[]>`
      SELECT count(*) AS failed FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL`;
    if (Number(m[0]?.failed ?? 0) > 0) return 'schema_incomplete';
  } catch {
    /* unreadable: failed-migration status unknown */
  }
  // Sign-in throttling and session revocation need these two tables. Without
  // them the app still signs people in, but unthrottled and without revocation
  // (fail open), so readiness must say so instead of reporting ok.
  try {
    const a = await query<{ attempt_t: string | null; version_t: string | null }[]>`
      SELECT to_regclass('"AuthAttempt"')::text AS attempt_t, to_regclass('"UserSessionVersion"')::text AS version_t`;
    if (!a[0]?.attempt_t || !a[0]?.version_t) return 'auth_tables_missing';
  } catch {
    return 'auth_tables_missing';
  }
  return 'ok';
}
