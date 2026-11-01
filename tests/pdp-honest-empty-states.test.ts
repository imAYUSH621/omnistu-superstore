import { readFileSync } from 'fs';

const pdp = readFileSync('app/(root)/product/[slug]/page.tsx', 'utf8');
const hero = readFileSync('components/shared/home/personal-hero.tsx', 'utf8');

describe('product page empty states', () => {
  it('shows stars and counts only when real reviews exist', () => {
    expect(pdp).toMatch(/Number\(product\.numReviews\) > 0 \?/);
    expect(pdp).toContain('data-testid=\'no-reviews-yet\'');
  });
  it('hides the About section when there is no description', () => {
    expect(pdp).toMatch(/product\.description && product\.description\.trim\(\)/);
  });
});

describe('home page category entry points', () => {
  it('has one Shop by category block (the department ribbon), not a second chip row in the hero', () => {
    expect(hero).not.toContain('shopByDepartment');
    expect(hero).not.toContain('getAllCategories');
  });
});

describe('bundled sample quads in database mode', () => {
  it('the mode check lives in a server component, not in a client component that cannot see DATABASE_URL', () => {
    const wrapper = readFileSync('components/shared/home/category-quads.tsx', 'utf8');
    const grid = readFileSync('components/shared/home/category-quads-grid.tsx', 'utf8');
    expect(wrapper).not.toContain("'use client'");
    expect(wrapper).toContain("catalogSource() !== 'sample'");
    expect(grid.startsWith("'use client'")).toBe(true);
    expect(grid).not.toContain('catalogSource');
  });
});
