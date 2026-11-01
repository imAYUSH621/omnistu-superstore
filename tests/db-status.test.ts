import { classifyDatabase } from '@/lib/db-status';

const q = (impl: (n: number) => unknown) => {
  let n = 0;
  return (async () => { n += 1; const r = impl(n); if (r instanceof Error) throw r; return r; }) as never;
};

describe('classifyDatabase', () => {
  it('not_configured when DATABASE_URL was never set (no query made)', async () => {
    const spy = jest.fn();
    expect(await classifyDatabase(false, spy as never)).toBe('not_configured');
    expect(spy).not.toHaveBeenCalled();
  });
  it('down when the connection check fails', async () => {
    expect(await classifyDatabase(true, q(() => new Error('ECONNREFUSED')))).toBe('down');
  });
  const core = { order_t: '"Order"', user_t: '"User"' };
  it('schema_incomplete when core tables are missing', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : [{ order_t: null, user_t: null }])))).toBe('schema_incomplete');
  });
  it('schema_incomplete when the core-table query errors', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : new Error('boom'))))).toBe('schema_incomplete');
  });
  it('schema_incomplete when a migration is recorded as failed', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : [{ failed: BigInt(1) }])))).toBe('schema_incomplete');
  });
  const authOk = { attempt_t: '"AuthAttempt"', version_t: '"UserSessionVersion"' };
  it('ok when the app role cannot read the migrations table (failed check unknown)', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : n === 3 ? new Error('permission denied for table _prisma_migrations') : [authOk])))).toBe('ok');
  });
  it('ok when tables exist, no migration failed and the auth tables exist', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : n === 3 ? [{ failed: BigInt(0) }] : [authOk])))).toBe('ok');
  });
  it('auth_tables_missing when either auth table is absent', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : n === 3 ? [{ failed: BigInt(0) }] : [{ attempt_t: null, version_t: '"UserSessionVersion"' }])))).toBe('auth_tables_missing');
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : n === 3 ? [{ failed: BigInt(0) }] : [{ attempt_t: '"AuthAttempt"', version_t: null }])))).toBe('auth_tables_missing');
  });
  it('auth_tables_missing when the check itself errors', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : n === 3 ? [{ failed: BigInt(0) }] : new Error('boom'))))).toBe('auth_tables_missing');
  });
});
