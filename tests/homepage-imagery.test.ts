import fs from 'fs';
import path from 'path';

// Guard against placeholder imagery returning to the homepage. The store
// must not show generated solid-color SVG tiles or category links that
// oversell catalog breadth it does not stock.
describe('homepage honest imagery', () => {
  const cards = fs.readFileSync(
    path.join(process.cwd(), 'components/shared/home/top-category-cards.tsx'),
    'utf8'
  );
  const quads = fs.readFileSync(
    path.join(process.cwd(), 'lib/constants/amazon-gateway-quads.ts'),
    'utf8'
  );

  it('uses no generated placeholder SVG tiles on homepage surfaces', () => {
    expect(cards).not.toMatch(/\/images\/tiles\//);
    expect(quads).not.toMatch(/\/images\/tiles\//);
  });

  it('quad items link only to real product pages or category searches', () => {
    expect(quads).not.toMatch(/\/s\?k=/);
    expect(quads).toMatch(/search\?category=/);
    // product links must target seeded slugs (no imagined products)
    const data = fs.readFileSync(path.join(process.cwd(), 'db/sample-data.ts'), 'utf8');
    const slugs = new Set([...data.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]));
    const linked = [...quads.matchAll(/prod\('([^']+)'\)/g)].map((m) => m[1]);
    expect(linked.length).toBeGreaterThan(5);
    const unknown = linked.filter((slug) => !slugs.has(slug));
    expect(unknown).toEqual([]);
  });

  it('every referenced image file exists in public/', () => {
    const refs = [...quads.matchAll(/[/]([a-z0-9-]+[.]jpg)/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(5);
    const missing = refs.filter(
      (r) => !fs.existsSync(path.join(process.cwd(), 'public/images/sample-products', r))
    );
    expect(missing).toEqual([]);
  });
});

// The fixed AI concierge launcher must not cover form controls on short
// viewports: it hides while any editable element has focus.
describe('ai concierge launcher focus behavior', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'components/shared/ai-concierge.tsx'),
    'utf8'
  );

  it('hides the launcher pre-hydration while an external form control has focus', () => {
    // launcher carries the stable class the CSS rule targets
    expect(src).toMatch(/ai-concierge-launcher/);
    expect(src).toMatch(/data-ai-concierge/);
    const layout = fs.readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8');
    // guard must run before hydration - SSR controls are focusable before React loads
    expect(layout).toMatch(/<script src='\/form-focus-guard.js' \/>/);
    const guard = fs.readFileSync(path.join(process.cwd(), 'public/form-focus-guard.js'), 'utf8');
    expect(guard).toMatch(/setAttribute\('data-form-focus', '1'\)/);
    // its own chat input must not hide the launcher (Close control)
    expect(guard).toMatch(/closest\('\[data-ai-concierge\]'\)/);
  });

  it('globals.css hides the launcher in the form-focus state', () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), 'assets/styles/globals.css'),
      'utf8'
    );
    expect(css).toMatch(/html\[data-form-focus='1'\] \.ai-concierge-launcher/);
  });
});
