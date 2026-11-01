/**
 * Premium category-first homepage: composition, real-data grounding,
 * honest copy (no fabricated counts/deals/provider claims), de-Amazoned
 * user-visible metadata.
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';

const page = readFileSync('app/(root)/page.tsx', 'utf8');
const ribbon = readFileSync('components/shared/home/department-ribbon.tsx', 'utf8');
const hero = readFileSync('components/shared/home/personal-hero.tsx', 'utf8');
const trust = readFileSync('components/shared/home/trust-ribbon.tsx', 'utf8');
const latest = readFileSync('components/shared/home/latest-arrivals.tsx', 'utf8');
const cards = readFileSync('components/shared/home/top-category-cards.tsx', 'utf8');

describe('premium category-first homepage', () => {
  it('composes personalization, departments, categories, arrivals, trust, quads', () => {
    for (const c of ['PersonalHero', 'DepartmentRibbon', 'TopCategoryCards', 'LatestArrivals', 'TrustRibbon', 'CategoryQuads']) {
      expect(page).toContain(c);
    }
  });

  it('department ribbon is driven by real catalog categories and counts', () => {
    expect(ribbon).toContain('getAllCategories');
    expect(ribbon).not.toMatch(/\d,\d{3}\+ items/); // no fabricated counts
    for (const fake of ['Beauty & Skincare', 'Fitness & Sports', 'Books & Learning', 'Automotive & Tools']) {
      expect(ribbon).not.toContain(fake); // departments that do not exist in the catalog
    }
  });

  it('latest arrivals shelf uses real products', () => {
    expect(latest).toContain('getLatestProducts');
  });

  it('personalization is grounded in real orders and cart, no invented promises', () => {
    expect(hero).toContain('getMyOrders');
    expect(hero).toContain('getMyCart');
    expect(hero).not.toContain('personalized recommendations');
    expect(hero).not.toContain('recommended for you');
  });

  it('trust ribbon makes no live provider payment claims', () => {
    expect(trust).not.toContain('Stripe');
    expect(trust).not.toContain('PayPal');
  });

  it('department ribbon header wraps and chip labels clamp instead of truncating', () => {
    expect(ribbon).toContain('flex-wrap');
    expect(ribbon).toContain('line-clamp-2');
    expect(ribbon).not.toContain('dark:text-white truncate');
  });

  it('user-visible metadata is de-Amazoned', () => {
    expect(page).not.toContain('Amazon');
    expect(cards).not.toContain('Amazon_Ember');
  });

  it('new homepage keys exist in all 6 languages', () => {
    const keys = ['shopByDepartment', 'newArrivals', 'welcomeBack', 'yourRecentOrders', 'pickUpYourCart', 'signInForOrders', 'trustCheckoutDesc'];
    for (const lang of ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'] as const) {
      const d = DICTIONARY[lang] as Record<string, string>;
      for (const k of keys) {
        expect(typeof d[k]).toBe('string');
        expect(d[k].length).toBeGreaterThan(2);
      }
    }
  });
});
