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

  it('links homepage quads only at real category searches', () => {
    expect(quads).not.toMatch(/\/s\?k=/);
    expect(quads).toMatch(/search\?category=/);
  });

  it('every referenced image file exists in public/', () => {
    const refs = [...quads.matchAll(/[/]([a-z0-9-]+[.]jpg)/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(10);
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

  it('hides the launcher while a form control has focus', () => {
    expect(src).toMatch(/addEventListener\('focusin'/);
    expect(src).toMatch(/formFocused \? 'hidden '/);
    expect(src).toMatch(/tagName === 'TEXTAREA'/);
  });
});
