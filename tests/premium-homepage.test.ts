/**
 * Premium category-first homepage: composition, real-data grounding,
 * honest copy (no fabricated counts/deals/provider claims), de-Amazoned
 * user-visible metadata.
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';
import { UNAVAILABLE_IMAGES } from '@/lib/constants/unavailable-images';

const page = readFileSync('app/(root)/page.tsx', 'utf8');
const ribbon = readFileSync('components/shared/home/department-ribbon.tsx', 'utf8');
const hero = readFileSync('components/shared/home/personal-hero.tsx', 'utf8');
const trust = readFileSync('components/shared/home/trust-ribbon.tsx', 'utf8');
const latest = readFileSync('components/shared/home/latest-arrivals.tsx', 'utf8');
const cards = readFileSync('components/shared/home/top-category-cards.tsx', 'utf8');
const header = readFileSync('components/shared/header/index.tsx', 'utf8');
const drawer = readFileSync('components/shared/header/category-drawer.tsx', 'utf8');

describe('premium category-first homepage', () => {
  it('composes personalization, departments, categories, arrivals, trust, quads', () => {
    expect(page).not.toContain('DepartmentRibbon'); // one category navigation: the illustrated rail
    for (const c of ['PersonalHero', 'DepartmentMosaic', 'LatestArrivals', 'TrustRibbon', 'CategoryQuads']) {
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

  it('department ribbon wraps and chip labels render in full (no clamp/truncate)', () => {
    expect(ribbon).toContain('flex-wrap');
    expect(ribbon).not.toContain('line-clamp');
    expect(ribbon).not.toContain('truncate');
  });

  it('top category cards never use a verified-mismatched image', () => {
    for (const img of UNAVAILABLE_IMAGES) {
      expect(cards).not.toContain(img);
    }
  });

  it('signed-out hero does not repeat the department links (the ribbon below owns them)', () => {
    expect(hero).not.toContain('getAllCategories');
    expect(cards).toContain('/search?category=');
  });

  it('header renders the All drawer label exactly once', () => {
    expect(header).not.toContain(">All</span>");
    expect(drawer).toContain("<HeaderText name='all'/>");
    expect(drawer).not.toContain('hidden sm:inline');
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
