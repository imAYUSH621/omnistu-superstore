import { readFileSync } from 'fs';
import { join } from 'path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('payment and security claims stay honest (source check, not a rendered check)', () => {
  it('cart makes no unsupported security or accepted-card claims anywhere', () => {
    const s = read('app/(root)/cart/cart-table.tsx');
    expect(s).not.toMatch(/256-bit/i);
    expect(s).not.toMatch(/Bank Grade/i);
    expect(s).not.toMatch(/We accept Visa/i);
    expect(s).not.toMatch(/Apple Pay/i);
    expect(s).not.toMatch(/Fulfilled by supplier partners/i);
    expect(s).not.toMatch(/Printify/);
  });

  it('cart labels payment, shipping and fulfillment as simulated in test mode', () => {
    const s = read('app/(root)/cart/cart-table.tsx');
    expect(s).toContain("<CT name='testPayment'/>");
    expect(read('lib/cart-language.ts')).toContain('Test checkout: simulated payment only. No card is charged.');
    expect(s).toContain("<CT name='testShipping'/>");
    expect(s).toContain("<CT name='testDelivery'/>");
    // the simulated wording is gated on the test-mode flag, not always shown
    expect(s).toMatch(/testMode/);
  });

  it('cart page wires the real test-mode flag into the table', () => {
    const s = read('app/(root)/cart/page.tsx');
    expect(s).toContain('testCheckoutMode');
    expect(s).toContain('testMode={testCheckoutMode()}');
  });

  it('buy box drops the Secure SSL payment note in test mode', () => {
    const s = read('components/shared/product/buy-box.tsx');
    expect(s).toContain('testMode ? t.simulated : t.paymentOff');
    expect(read('lib/product-language.ts')).toContain('Simulated payment (test mode) - no card is charged.');
    expect(s).toMatch(/testMode \?/);
  });
});
