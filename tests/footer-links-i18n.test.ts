/**
 * G4 follow-up: footer link labels must be keyed for translation,
 * not hardcoded English (footer headings already were).
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';

const footer = readFileSync('components/footer.tsx', 'utf8');

const labels = ['Shipping Policy', 'Refund Policy', 'Sustainability', 'Become an Affiliate', 'Privacy Notice', 'Conditions of Use', 'Your Account', 'Your Orders & Tracking', 'Contact & Support', 'Help & Privacy Center', 'Supply via CJ Dropshipping', 'Printify On-Demand Lab', 'Shipping Rates & Policies', 'Returns & Replacements', 'Shipping & Carrier Policy', 'Returns & Refund Policy'];
// The 'Make Money With Us' column (Seller Central, Sell on Omnistu, Supply
// via CJ, Printify Lab, Affiliate) was removed: every entry pointed at /admin
// and advertised seller/supplier/affiliate programs that are not built.
const keys = ['backToTop', 'footerDemoNote', 'footerAbout', 'footerShippingPolicy', 'footerRefundPolicy', 'footerPrivacy', 'footerTerms', 'footerYourAccount', 'footerOrdersTracking', 'footerContact', 'footerHelpCenter', 'footerShippingRates', 'footerReturns', 'footerShippingCarrier', 'footerReturnsRefunds'];

describe('footer link labels i18n (G4)', () => {
  it('sustainability link stays out while the page is gated for fabricated claims', () => {
    expect(footer).not.toContain("href='/sustainability'");
    expect(footer).not.toContain("k='footerSustainability'");
  });

  it('removed seller/supplier/affiliate column stays out of the footer', () => {
    for (const k of ['footerSellOn', 'footerSupplyCJ', 'footerPrintify', 'footerAffiliate', 'makeMoneyWithUs', 'sellerCentral']) {
      expect(footer).not.toContain(`k='${k}'`);
    }
    expect(footer).not.toContain("href='/admin'");
  });

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
