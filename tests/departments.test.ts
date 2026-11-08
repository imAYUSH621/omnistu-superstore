import { existsSync, readFileSync } from 'fs';
import{HOME_COPY}from '@/lib/home-language';
import { DEPARTMENTS } from '@/lib/constants/departments';

const ORIGINAL_SIX = [
  'Custom Apparel', 'Gourmet & Indian Food', 'Tech & Gadgets',
  'Jewelry & Watches', 'Home & Lifestyle', 'Toys & Games',
];

describe('home departments', () => {
  it('keeps all original six with apparel first', () => {
    expect(DEPARTMENTS.slice(0, 6).map((d) => d.name)).toEqual(ORIGINAL_SIX);
  });
  it('has unique names and every image file exists', () => {
    const names = DEPARTMENTS.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
    expect(DEPARTMENTS.length).toBeGreaterThanOrEqual(18);
    for (const d of DEPARTMENTS) expect(existsSync(`public${d.image}`)).toBe(true);
  });
  it('makes no parity or stock claim and shows empty departments honestly', () => {
    const src = readFileSync('components/shared/home/all-departments.tsx', 'utf8');
    const data = readFileSync('lib/constants/departments.ts', 'utf8');
    expect(src).toContain('<HomeText count={n}/>');expect(HOME_COPY.EN.empty).toBe('No items yet');
    expect(src + data).not.toMatch(/amazon.*(match|parity|same)/i);
    expect(src).not.toMatch(/in stock|bestseller|rated/i);
  });
});

it('leads discovery with clearly illustrative apparel artwork before the account prompt', () => {
  const src = readFileSync('components/shared/home/top-category-cards.tsx', 'utf8');
  const home = readFileSync('app/(root)/page.tsx', 'utf8');
  expect(src.indexOf("title: 'Custom Apparel'")).toBeLessThan(src.indexOf("title: 'Royal Gourmet & Indian Food'"));
  expect(src).toContain('custom-apparel-editorial.webp');
  expect(src).toContain('Category artwork is illustrative.');
  expect(home.indexOf('<DepartmentMosaic />')).toBeLessThan(home.indexOf('<PersonalHero />'));
  expect(existsSync('public/images/categories/custom-apparel.jpg')).toBe(true);
  expect(DEPARTMENTS).toHaveLength(18);
});


it('mosaic uses only existing category routes and keeps a full directory', () => {
 const src = readFileSync('components/shared/home/department-mosaic.tsx', 'utf8');
 expect(src).toContain("<HomeText name='illustration'/>");expect(HOME_COPY.EN.illustration).toContain('Category images are illustrations, not items for sale.');
 expect(src).toContain("<HomeText name='browseCategories'/>");expect(HOME_COPY.EN.browseCategories).toBe('Browse all categories');
 expect(src).toContain("<HomeText name='clothing'/>");expect(HOME_COPY.EN.clothing).toBe('Browse clothing');
 expect(src).not.toContain('Explore the department');
 expect(DEPARTMENTS[0].image).toBe('/images/categories/custom-apparel.jpg');
 expect(src).not.toMatch(/bestseller|free shipping|under \$|in stock|women.s clothing|men.s clothing/i);
 const home = readFileSync('app/(root)/page.tsx', 'utf8');
 expect(home).toContain('<AllDepartments />');
});
