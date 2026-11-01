import { readFileSync } from 'fs';
import { join } from 'path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('cart page claims and image fallbacks (source check, not a rendered check)', () => {
  it('cart lines make no stock or shipping promise', () => {
    const s = read('app/(root)/cart/cart-table.tsx');
    expect(s).not.toMatch(/FREE Express Shipping/);
    expect(s).not.toMatch(/>In Stock</);
  });
  it('every product surface falls back to the same neutral placeholder', () => {
    for (const f of [
      'components/shared/product/buy-box.tsx',
      'components/shared/product/product-card.tsx',
      'components/shared/search/product-horizontal-card.tsx',
      'components/shared/search/deals-carousel-strip.tsx',
      'components/shared/cart/cart-drawer.tsx',
    ]) {
      const s = read(f);
      expect(s).toContain('/images/products/placeholder.svg');
      expect(s).not.toContain('p1-1.jpg');
      expect(s).not.toContain('silicone-magnetic-balls-1.svg');
    }
  });
});
