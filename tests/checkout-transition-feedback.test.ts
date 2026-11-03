/**
 * Checkout step transitions (server action + RSC navigation) can take many
 * seconds on a cold function. Release finding D12: with only the small
 * button spinner, the wait read as a dead click and users re-clicked. Each
 * step form now shows an accessible, persistent pending note (role=status,
 * aria-live) that sets the expectation not to re-click, and the two static
 * steps prefetch the next step's RSC payload while the user fills the form
 * (GET-only read of the viewer's own data; no writes, no shared cache).
 */
import { readFileSync } from 'fs';

const note = readFileSync('components/shared/checkout-pending-note.tsx', 'utf8');
const pm = readFileSync('app/(root)/payment-method/payment-method-form.tsx', 'utf8');
const ship = readFileSync('app/(root)/shipping-address/shipping-address-form.tsx', 'utf8');
const po = readFileSync('app/(root)/place-order/place-order-form.tsx', 'utf8');

describe('checkout transition pending feedback (D12)', () => {
  it('pending note is an accessible polite status region', () => {
    expect(note).toContain("role='status'");
    expect(note).toContain("aria-live='polite'");
    expect(note).toContain("data-testid='checkout-pending-note'");
  });

  it('payment-method shows the note while saving and prefetches /place-order', () => {
    expect(pm).toContain("router.prefetch('/place-order')");
    expect(pm).toContain('show={isPending}');
    expect(pm).toContain('No need to click again');
  });

  it('shipping-address shows the note while saving and prefetches /payment-method', () => {
    expect(ship).toContain("router.prefetch('/payment-method')");
    expect(ship).toContain('show={isPending}');
    expect(ship).toContain('No need to click again');
  });

  it('place-order shows the note while placing and names the idempotent retry', () => {
    expect(po).toContain('show={pending}');
    expect(po).toContain('second submit reuses the same order');
  });

  it('all three step buttons stay disabled while pending (double-submit guard)', () => {
    expect(pm).toContain('disabled={isPending');
    expect(ship).toContain('disabled={isPending}');
    expect(po).toContain('disabled={pending}');
  });
});
