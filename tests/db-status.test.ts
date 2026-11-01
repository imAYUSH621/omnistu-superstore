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
  it('schema_incomplete when core tables are missing', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : [{ order_t: null, user_t: null, failed: null }])))).toBe('schema_incomplete');
  });
  it('schema_incomplete when a migration is recorded as failed', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : [{ order_t: '"Order"', user_t: '"User"', failed: BigInt(1) }])))).toBe('schema_incomplete');
  });
  it('ok when tables exist and no migration failed', async () => {
    expect(await classifyDatabase(true, q((n) => (n === 1 ? [{}] : [{ order_t: '"Order"', user_t: '"User"', failed: BigInt(0) }])))).toBe('ok');
  });
});
