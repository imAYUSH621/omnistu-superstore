/**
 * Cart badge must seed from the server cart, not the never-written
 * sessionCartCount cookie (badge silently reset to 0 on navigation).
 */
import { readFileSync } from 'fs';

const badge = readFileSync('components/shared/header/cart-badge.tsx', 'utf8');
const menu = readFileSync('components/shared/header/menu.tsx', 'utf8');

describe('cart badge server-seeded count', () => {
  it('badge accepts and initializes from initialCount prop', () => {
    expect(badge).toContain('initialCount = 0');
    expect(badge).toContain('useState<number>(initialCount)');
  });

  it('badge no longer reads the never-written sessionCartCount cookie', () => {
    expect(badge).not.toContain('sessionCartCount');
  });

  it('menu fetches the server cart and passes the item count to both badges', () => {
    expect(menu).toContain("import { getMyCart } from '@/lib/actions/cart.actions'");
    expect(menu).toContain('reduce((sum, item) => sum + item.qty, 0)');
    expect(menu.match(/<CartBadge initialCount=\{cartCount\} \/>/g)!.length).toBe(2);
  });

  it('same-page increment events still work', () => {
    expect(badge).toContain("window.addEventListener('omnistu:cart-updated', handleCartUpdate)");
  });
});
