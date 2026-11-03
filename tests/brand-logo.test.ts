/**
 * Brand logo implementation (user-supplied logo pack v2): header renders the
 * wide PNG at 40-44px with a CSS masked shine (reduced-motion safe), the pack
 * favicon and apple touch icon are wired via Next conventions, and no logo
 * assets beyond the two header weights ship in the initial web load.
 */
import { readFileSync, existsSync, statSync } from 'fs';

const header = readFileSync('components/shared/header/index.tsx', 'utf8');
const css = readFileSync('assets/styles/globals.css', 'utf8');

describe('brand logo (pack v2)', () => {
  it('header renders the wide logo image at 40-44px with a test hook', () => {
    expect(header).toContain("/images/logo/omnistu-logo-wide-400.png");
    expect(header).toContain("h-10 sm:h-11");
    expect(header).toContain("data-testid='site-logo'");
    expect(header).toContain('logo-shine');
  });

  it('shine is a CSS masked overlay and respects prefers-reduced-motion', () => {
    expect(css).toContain('.logo-shine::after');
    expect(css).toContain('@keyframes omnistu-shine');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.logo-shine::after[\s\S]*?animation: none/);
  });

  it('pack favicon and apple touch icon are wired via Next file conventions', () => {
    expect(existsSync('app/favicon.ico')).toBe(true);
    expect(statSync('app/favicon.ico').size).toBeGreaterThan(1000);
    expect(existsSync('app/apple-icon.png')).toBe(true);
  });

  it('only the 400px logo weight is referenced by code (no full-pack initial load)', () => {
    expect(header).not.toContain('omnistu-logo-wide.png');
    expect(header).not.toContain('omnistu-logo-anim');
    expect(css).not.toContain('omnistu-logo-anim');
  });

  it('checkout carries no logo decoration', () => {
    const po = readFileSync('app/(root)/place-order/place-order-form.tsx', 'utf8');
    expect(po).not.toContain('logo-shine');
    expect(po).not.toContain('omnistu-logo');
  });
});
