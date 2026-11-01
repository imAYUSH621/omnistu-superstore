/** @jest-environment node */
import CategoryQuads from '@/components/shared/home/category-quads';

describe('CategoryQuads server wrapper (behaviour, not source text)', () => {
  const old = process.env.DATABASE_URL;
  afterEach(() => { if (old === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = old; });

  it('renders nothing in database mode', () => {
    process.env.DATABASE_URL = 'postgresql://u:p@db.example.com:5432/x';
    expect(CategoryQuads()).toBeNull();
  });
  it('renders the bundled sample grid in sample mode', () => {
    delete process.env.DATABASE_URL;
    expect(CategoryQuads()).not.toBeNull();
  });
});
