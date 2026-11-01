import { buildOrderTrackingView } from '@/lib/tracking';

describe('order tracking honesty', () => {
  it('shows no carrier, tracking number, or delivery estimate for an undispatched paid order', () => {
    const view = buildOrderTrackingView({ isPaid: true, isDelivered: false });
    const text = JSON.stringify(view);
    expect(view.carrierStatus).toBe('Not yet dispatched');
    expect(view.hasTracking).toBe(false);
    expect(text).not.toMatch(/OMN-\d/);
    expect(text).not.toContain('Omnistu Express');
    expect(text).not.toMatch(/estimated/i);
    expect(text).not.toMatch(/tomorrow/i);
    expect(text).not.toMatch(/in transit/i);
    expect(view.steps[2].completed).toBe(false);
    expect(view.steps[2].desc).toBe('Not yet dispatched');
  });

  it('does not mark Shipped complete just because the order is paid', () => {
    const view = buildOrderTrackingView({ isPaid: true, isDelivered: false, dispatchStatus: 'PENDING' });
    expect(view.steps[2].completed).toBe(false);
    expect(view.progress).toBe('processing');
  });

  it('shows the real carrier and tracking number once dispatch data exists', () => {
    const view = buildOrderTrackingView({
      isPaid: true,
      isDelivered: false,
      dispatchStatus: 'DISPATCHED',
      trackingCarrier: 'Delhivery',
      trackingNumber: 'DLV123456789',
    });
    expect(view.carrierStatus).toBe('Dispatched');
    expect(view.carrierDetail).toContain('Delhivery');
    expect(view.carrierDetail).toContain('DLV123456789');
    expect(view.hasTracking).toBe(true);
    expect(view.steps[2].completed).toBe(true);
  });

  it('marks all steps complete only when actually delivered', () => {
    const view = buildOrderTrackingView({ isPaid: true, isDelivered: true, trackingNumber: 'X1' });
    expect(view.steps.every((s) => s.completed)).toBe(true);
    expect(view.carrierStatus).toBe('Delivered');
    expect(view.steps[3].desc).toBe('Package delivered');
  });

  it('shows awaiting payment for an unpaid order', () => {
    const view = buildOrderTrackingView({ isPaid: false, isDelivered: false });
    expect(view.steps[1].desc).toBe('Awaiting payment');
    expect(view.steps[1].completed).toBe(false);
    expect(view.progress).toBe('placed');
  });
});

describe('shipping badge honesty (D19)', () => {
  it('never shows In Transit for an undispatched order', async () => {
    const { shippingBadgeState } = await import('@/lib/tracking');
    expect(shippingBadgeState({ isDelivered: false, dispatchStatus: null, trackingNumber: null })).toBe('not_dispatched');
    expect(shippingBadgeState({ isDelivered: false, dispatchStatus: 'PENDING', trackingNumber: null })).toBe('not_dispatched');
  });
  it('shows in_transit only with real dispatch and delivered only when delivered', async () => {
    const { shippingBadgeState } = await import('@/lib/tracking');
    expect(shippingBadgeState({ isDelivered: false, dispatchStatus: 'DISPATCHED', trackingNumber: null })).toBe('in_transit');
    expect(shippingBadgeState({ isDelivered: false, dispatchStatus: null, trackingNumber: 'T1' })).toBe('in_transit');
    expect(shippingBadgeState({ isDelivered: true, dispatchStatus: 'DISPATCHED', trackingNumber: 'T1' })).toBe('delivered');
  });
});

describe('/track page shows no simulated status (source check)', () => {
  it('has no invented carrier, tracking number or delivery estimate', () => {
    const src = require('fs').readFileSync('app/(root)/track/page.tsx', 'utf8');
    for (const bad of [/Math\.random/, /IN_TRANSIT/, /USPS/, /92055901649173/, /estimatedDelivery/, /setTimeout/]) {
      expect(src).not.toMatch(bad);
    }
  });
});
