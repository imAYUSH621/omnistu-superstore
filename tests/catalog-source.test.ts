import { isDatabaseAvailable, catalogSource } from '@/lib/utils';

describe('catalog source mode', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });
  it('sample when DATABASE_URL is unset', () => {
    delete process.env.DATABASE_URL;
    expect(catalogSource()).toBe('sample');
  });
  it('database for a remote URL', () => {
    process.env.DATABASE_URL = 'postgresql://u:p@db.example.com:5432/x';
    expect(isDatabaseAvailable()).toBe(true);
    expect(catalogSource()).toBe('database');
  });
  it('localhost serves the sample unless ALLOW_LOCAL_DATABASE=1', () => {
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/x';
    delete process.env.ALLOW_LOCAL_DATABASE;
    expect(catalogSource()).toBe('sample');
    process.env.ALLOW_LOCAL_DATABASE = '1';
    expect(catalogSource()).toBe('database');
  });
});
