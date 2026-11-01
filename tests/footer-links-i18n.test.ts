/**
 * G4 follow-up: footer link labels must be keyed for translation,
 * not hardcoded English (footer headings already were).
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';

const footer = readFileSync('components/footer.tsx', 'utf8');

const labels = ['Shipping Policy', 'Refund Policy', 'Sustainability', 'Become an Affiliate', 'Privacy Notice', 'Conditions of Use', 'Your Account', 'Your Orders & Tracking', 'Contact & Support', 'Help & Privacy Center', 'Supply via CJ Dropshipping', 'Printify On-Demand Lab', 'Shipping Rates & Policies', 'Returns & Replacements', 'Shipping & Carrier Policy', 'Returns & Refund Policy'];
const keys = ['backToTop', 'footerDemoNote', 'footerAbout', 'footerSellOn', 'footerShippingPolicy', 'footerRefundPolicy', 'footerSustainability', 'footerAffiliate', 'footerPrivacy', 'footerTerms', 'footerYourAccount', 'footerOrdersTracking', 'footerContact', 'footerHelpCenter', 'footerSupplyCJ', 'footerPrintify', 'footerShippingRates', 'footerReturns', 'footerShippingCarrier', 'footerReturnsRefunds'];

describe('footer link labels i18n (G4)', () => {
  it('no hardcoded English link labels remain in footer.tsx', () => {
    for (const label of labels) {
      const hard = new RegExp('>\\s*' + label.replace(/[.*+?^$()[\]{}|&]/g, '\\$&') + '\\s*<');
      expect(hard.test(footer)).toBe(false);
    }
    expect(footer).not.toContain('About {APP_NAME}');
    expect(footer).not.toContain('Sell on {APP_NAME}');
    expect(footer).not.toContain('Back to top\n');
    expect(footer).not.toContain('Demo catalog in test mode.');
  });

  it('every footer link renders through T', () => {
    for (const k of keys) {
      expect(footer).toContain(`<T k='${k}' />`);
    }
  });

  it('footer keys exist in all 6 languages', () => {
    for (const lang of ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'] as const) {
      const d = DICTIONARY[lang] as Record<string, string>;
      for (const k of keys) {
        expect(typeof d[k]).toBe('string');
        expect(d[k].length).toBeGreaterThan(2);
      }
    }
  });
});
