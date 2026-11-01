jest.mock('@/lib/utils', () => ({ catalogSource: jest.fn() }));
import sitemap from '@/app/sitemap';
import { catalogSource } from '@/lib/utils';

const urls = () => sitemap().map((e) => e.url);

describe('sitemap lists only URLs that resolve', () => {
  it('has no /blog or /bestsellers/fashion (no such page content)', () => {
    (catalogSource as jest.Mock).mockReturnValue('sample');
    expect(urls().some((u) => u.endsWith('/blog') || u.endsWith('/bestsellers/fashion'))).toBe(false);
  });
  it('lists bestsellers only in sample mode', () => {
    (catalogSource as jest.Mock).mockReturnValue('database');
    expect(urls().some((u) => u.includes('/bestsellers/'))).toBe(false);
    (catalogSource as jest.Mock).mockReturnValue('sample');
    expect(urls().filter((u) => u.includes('/bestsellers/')).length).toBe(2);
  });
});
