import { existsSync, readFileSync } from 'fs';
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
    expect(src).toContain('No items yet');
    expect(src + data).not.toMatch(/amazon.*(match|parity|same)/i);
    expect(src).not.toMatch(/in stock|bestseller|rated/i);
  });
});
