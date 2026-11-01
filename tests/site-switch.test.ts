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
  it('services catalog carries no invented offerings while empty', () => {
    expect(Array.isArray(SERVICES)).toBe(true);
    for (const s of SERVICES) expect(s.title && s.summary && s.slug).toBeTruthy();
  });
});
