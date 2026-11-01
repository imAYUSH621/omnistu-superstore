/**
 * G4 follow-up: checkout chrome (stepper, card titles, Edit, Place Order,
 * Continue, shipping heading/subtitle) must be keyed for translation.
 */
import { readFileSync } from 'fs';
import { DICTIONARY } from '@/lib/i18n';

const steps = readFileSync('components/shared/checkout-steps.tsx', 'utf8');
const placeOrder = readFileSync('app/(root)/place-order/page.tsx', 'utf8');
const placeOrderForm = readFileSync('app/(root)/place-order/place-order-form.tsx', 'utf8');
const shippingForm = readFileSync('app/(root)/shipping-address/shipping-address-form.tsx', 'utf8');
const paymentForm = readFileSync('app/(root)/payment-method/payment-method-form.tsx', 'utf8');

describe('checkout chrome i18n (G4)', () => {
  it('stepper renders keyed labels', () => {
    for (const k of ['userLoginLabel', 'shippingAddressLabel', 'paymentMethodLabel', 'placeOrder']) {
      expect(steps).toContain(`'${k}'`);
    }
  });

  it('place-order page card titles and Edit buttons are keyed', () => {
    expect(placeOrder).toContain("<T k='shippingAddressLabel' />");
    expect(placeOrder).toContain("<T k='paymentMethodLabel' />");
    expect(placeOrder.match(/<T k='editLabel' \/>/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it('place-order and continue buttons are keyed', () => {
    expect(placeOrderForm).toContain("<T k='placeOrder' />");
    expect(shippingForm).toContain("<T k='continueLabel' />");
    expect(paymentForm).toContain("<T k='continueLabel' />");
  });

  it('shipping heading and subtitle are keyed (typo fixed)', () => {
    expect(shippingForm).toContain("<T k='shippingAddressLabel' />");
    expect(shippingForm).toContain("<T k='shippingAddressSubtitle' />");
    expect(shippingForm).not.toContain('Please enter and address');
  });

  it('new keys exist in all 6 languages', () => {
    const keys = ['shippingAddressLabel', 'paymentMethodLabel', 'editLabel', 'userLoginLabel', 'shippingAddressSubtitle'];
    for (const lang of ['EN', 'HI', 'ES', 'FR', 'DE', 'JA'] as const) {
      const d = DICTIONARY[lang] as Record<string, string>;
      for (const k of keys) {
        expect(typeof d[k]).toBe('string');
        expect(d[k].length).toBeGreaterThan(1);
      }
    }
  });
});
