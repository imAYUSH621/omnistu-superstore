/**
 * Account overview (/user): personalization grounded strictly in the
 * signed-in user's own orders, cart and return requests; signed-out
 * visitors are redirected; no invented recommendations or tracking.
 * Plus subnav quick-link honesty (no dead sorts or wrong categories).
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';

const page = readFileSync('app/user/page.tsx', 'utf8');
const nav = readFileSync('app/user/main-nav.tsx', 'utf8');
const layout = readFileSync('app/user/layout.tsx', 'utf8');
const header = readFileSync('components/shared/header/index.tsx', 'utf8');

describe('account overview personalization', () => {
  it('requires sign-in', () => {
    expect(page).toContain('await auth()');
    expect(page).toContain("redirect('/sign-in?callbackUrl=/user')");
  });

  it('derives everything from the user\'s own orders, cart and returns', () => {
    expect(page).toContain('getMyOrders');
    expect(page).toContain('getMyCart');
    expect(page).toContain('getMyReturns');
    expect(page).not.toMatch(/recommended for you|personalized recommendations|recently viewed/i);
  });

  it('is reachable from the account nav', () => {
    expect(nav).toContain("href: '/user',");
  });

  it('account chrome sits on the dark bar the header menu was designed for', () => {
    // menu.tsx hardcodes text-white; a white top bar made account chrome invisible
    expect(layout).toContain('bg-[#0f172a]');
    expect(nav).not.toContain('text-muted-foreground');
  });

  it('new account keys exist in all 6 languages', () => {
    for (const lang of ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'] as const) {
      const d = DICTIONARY[lang] as Record<string, string>;
      for (const k of ['yourReturns', 'noReturnsYet', 'requestReturn']) {
        expect(typeof d[k]).toBe('string');
        expect(d[k].length).toBeGreaterThan(1);
      }
    }
  });
});

describe('subnav quick-link honesty', () => {
  it('no links to sorts that do not exist (deals/trending silently showed newest)', () => {
    expect(header).not.toContain('sort=deals');
    expect(header).not.toContain('sort=trending');
  });

  it('category quick links use real catalog categories, not near-miss values', () => {
    expect(header).toContain('/search?category=Tech%20%26%20Gadgets');
    expect(header).toContain('/search?category=Jewelry%20%26%20Watches');
    expect(header).toContain('/search?category=Custom%20Apparel');
    // previous values matched zero products (exact-match filter)
    expect(header).not.toContain("/search?category=Electronics'");
    expect(header).not.toContain("/search?category=Jewelry'");
    expect(header).not.toContain("/search?category=Merch'");
  });
});
