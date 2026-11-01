/**
 * Regression: mobile /search must not overflow horizontally.
 * Root cause found via real-browser measurement (docScrollW 854 on a 390px
 * viewport): the results column is a child of `items-start`, which in column
 * direction sizes flex items to their max-content width instead of the
 * container. Pin the stretch classes and the honest-image wiring.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const pageSrc = readFileSync(join(__dirname, '../app/(root)/search/page.tsx'), 'utf8');
const cardSrc = readFileSync(
  join(__dirname, '../components/shared/search/product-horizontal-card.tsx'),
  'utf8',
);

describe('search page mobile layout contract', () => {
  it('stretches children full-width on mobile, keeps items-start on md+ (sticky sidebar)', () => {
    expect(pageSrc).toContain('items-stretch md:items-start');
  });

  it('horizontal result card renders the honest unavailable-image tile', () => {
    expect(cardSrc).toContain("from '@/components/shared/product/product-image'");
    expect(cardSrc).not.toContain("import Image from 'next/image'");
  });
});
