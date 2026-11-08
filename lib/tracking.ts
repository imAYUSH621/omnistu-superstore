// Order tracking view model. Everything shown to the customer must come from
// real persisted order data - never invent carrier names, tracking numbers,
// delivery estimates, or map links.
export interface TrackingInput {
  simulated?: boolean;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt?: Date | string;
  dispatchStatus?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  dispatchedAt?: Date | string | null;
}

export interface TrackingStep {
  title: string;
  desc: string;
  completed: boolean;
}

export interface TrackingView {
  steps: TrackingStep[];
  progress: 'placed' | 'processing' | 'shipped' | 'delivered';
  carrierStatus: string;
  carrierDetail: string;
  hasTracking: boolean;
}

export function buildOrderTrackingView(input: TrackingInput): TrackingView {
  if (input.simulated) return {
    steps: [
      { title: 'Test order saved', desc: 'Simulation only', completed: true },
      { title: 'Test payment', desc: input.isPaid ? 'Payment simulated, no real charge' : 'Simulation pending', completed: input.isPaid },
      { title: 'No real shipment', desc: 'No carrier dispatch is confirmed', completed: false },
      { title: 'Test delivery', desc: input.isDelivered ? 'Delivery simulated, not a shipment' : 'Simulation pending', completed: input.isDelivered },
    ],
    progress: input.isPaid ? 'processing' : 'placed',
    carrierStatus: 'Test order - no real shipment',
    carrierDetail: 'Payment and delivery states are simulated. No real carrier tracking, delivery, return or refund is confirmed.',
    hasTracking: false,
  };

  const dispatched =
    input.isDelivered ||
    input.dispatchStatus === 'DISPATCHED' ||
    Boolean(input.trackingNumber);

  const steps: TrackingStep[] = [
    {
      title: 'Order Placed',
      desc: input.createdAt
        ? `Placed ${new Date(input.createdAt).toLocaleDateString()}`
        : input.isPaid
          ? 'Payment confirmed'
          : 'Payment pending',
      completed: true,
    },
    {
      title: 'Processing',
      desc: input.isPaid ? 'Payment confirmed - fulfillment pending' : 'Awaiting payment',
      completed: input.isPaid,
    },
    {
      title: 'Shipped',
      desc: dispatched
        ? input.trackingCarrier
          ? `Dispatched via ${input.trackingCarrier}`
          : 'Dispatched'
        : 'Not yet dispatched',
      completed: dispatched,
    },
    {
      title: 'Delivered',
      desc: input.isDelivered ? 'Package delivered' : 'Not yet delivered',
      completed: input.isDelivered,
    },
  ];

  const hasTracking = Boolean(input.trackingNumber);
  const carrierStatus = input.isDelivered
    ? 'Delivered'
    : dispatched
      ? 'Dispatched'
      : 'Not yet dispatched';
  const carrierDetail = hasTracking
    ? `Dispatched via ${input.trackingCarrier || 'carrier'} (Tracking #${input.trackingNumber})`
    : dispatched
      ? 'Dispatched - tracking number not yet provided by the supplier.'
      : 'No carrier or tracking number assigned yet. This updates when the order actually ships.';

  return {
    steps,
    progress: input.isDelivered ? 'delivered' : dispatched ? 'shipped' : input.isPaid ? 'processing' : 'placed',
    carrierStatus,
    carrierDetail,
    hasTracking,
  };
}

export type ShippingBadgeState = 'delivered' | 'in_transit' | 'not_dispatched';

/**
 * Shipping-address card badge. 'In Transit' must only appear when the order
 * actually dispatched; an undelivered order with no dispatch is NOT in transit.
 */
export function shippingBadgeState(input: {
  isDelivered?: boolean | null;
  dispatchStatus?: string | null;
  trackingNumber?: string | null;
}): ShippingBadgeState {
  if (input.isDelivered) return 'delivered';
  if (input.dispatchStatus === 'DISPATCHED' || input.trackingNumber) return 'in_transit';
  return 'not_dispatched';
}
