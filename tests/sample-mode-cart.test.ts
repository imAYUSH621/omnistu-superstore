/**
 * D26: sample-catalog preview mode must not show actionable cart CTAs.
 * Sample products (id sample-<slug>) have no database row, so Add to
 * Cart would silently fail - the buy box must render an honest disabled
 * state instead.
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';

const buyBox = readFileSync('components/shared/product/buy-box.tsx', 'utf8');

describe('sample-catalog preview mode (D26)', () => {
  it('buy box detects sample ids and suppresses the CTAs', () => {
    expect(buyBox).toContain("product.id.startsWith('sample-')");
    expect(buyBox).toContain("!product.id.startsWith('sample-')");
  });

  it('renders an honest explanation instead of a fabricated CTA', () => {
    expect(buyBox).toContain("data-testid='sample-mode-note'");
    expect(buyBox).toContain("<T k='sampleModeNote' />");
  });

  it('sampleModeNote exists in all 6 languages', () => {
    for (const lang of ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'] as const) {
      const note = (DICTIONARY[lang] as Record<string, string>).sampleModeNote;
      expect(typeof note).toBe('string');
      expect(note.length).toBeGreaterThan(20);
    }
  });
});
