import { readFileSync } from 'fs';
import { isServicesPath } from '@/components/shared/header/site-switch';
import { SERVICES } from '@/lib/services-catalog';

describe('Products/Services switch', () => {
  it('detects the services side only for /services paths', () => {
    expect(isServicesPath('/services')).toBe(true);
    expect(isServicesPath('/services/web')).toBe(true);
    for (const p of ['/', '/search', '/servicesx', '/product/x', null]) expect(isServicesPath(p as string | null)).toBe(false);
  });
  it('header renders the switch on desktop and mobile and uses category naming', () => {
    const h = readFileSync('components/shared/header/index.tsx', 'utf8');
    expect((h.match(/<SiteSwitch/g) || []).length).toBe(2);
    for (const f of ['components/shared/header/search.tsx', 'components/shared/header/category-drawer.tsx', 'components/shared/search/search-faceted-sidebar.tsx']) {
      expect(readFileSync(f, 'utf8')).not.toMatch(/All Departments|Shop by Department/);
    }
  });
  it('services catalog has unique slugs and no price/guarantee/count claims', () => {
    expect(SERVICES.length).toBeGreaterThan(0);
    expect(new Set(SERVICES.map((x) => x.slug)).size).toBe(SERVICES.length);
    const text = JSON.stringify(SERVICES);
    expect(text).not.toMatch(/\$|USD|₹|guarantee|within \d|days|%|\d{2,}\+?\s*(clients|projects|channels)/i);
    for (const s of SERVICES) expect(s.title && s.summary && s.covers.length).toBeTruthy();
  });
  it('brand wordmark uses omnistu.com, not .us', () => {
    for (const f of ['components/shared/header/index.tsx', 'components/footer.tsx']) {
      const t = readFileSync(f, 'utf8');
      expect(t).not.toMatch(/>\s*\.us\s*</);
      expect(t).toMatch(/\.com/);
    }
  });
});

describe('assistant launcher does not cover content on phones', () => {
  it('is icon-only below sm, and the page reserves room under main', () => {
    const c = readFileSync('components/shared/ai-concierge.tsx', 'utf8');
    expect(c).toMatch(/hidden sm:inline[^"]*"?>\{open/);
    expect(c).toMatch(/p-2.5 sm:px-4 sm:py-3/);
    expect(c).toContain('aria-label={open ?'); // still labelled for screen readers
    expect(readFileSync('app/(root)/layout.tsx', 'utf8')).toMatch(/<main className='flex-1 w-full pb-16 sm:pb-0'>/);
  });
});
