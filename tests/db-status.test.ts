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
  it('ok when the app role cannot read the migrations table (failed check unknown)', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : new Error('permission denied for table _prisma_migrations'))))).toBe('ok');
  });
  it('ok when tables exist and no migration failed', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : n === 2 ? [core] : [{ failed: BigInt(0) }])))).toBe('ok');
  });
});
