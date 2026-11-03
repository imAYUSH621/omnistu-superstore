/**
 * Regression: place-order review page linked every item to the literal
 * "/product/{item.slug}" (missing $ in the template literal) - a 404 link
 * and a wasted bogus RSC prefetch on every render.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    if (e === 'node_modules' || e.startsWith('.')) return [];
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });

describe('product links interpolate the slug', () => {
  it('no tsx file contains the uninterpolated /product/{...} literal', () => {
    const offenders: string[] = [];
    for (const f of [...walk('app'), ...walk('components')]) {
      if (/href=\{`\/product\/\{/.test(readFileSync(f, 'utf8'))) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
  it('place-order review links to the real product page', () => {
    const s = readFileSync('app/(root)/place-order/page.tsx', 'utf8');
    expect(s).toContain('href={`/product/${item.slug}`}');
  });
});
