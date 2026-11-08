import {ORDER_DETAIL_COPY} from './order-detail-language';
import type {SupportLanguage} from './support-language';
import {orderHistoryDate} from './order-history-language';
// Order tracking view model. Everything shown to the customer must come from
// real persisted order data - never invent carrier names, tracking numbers,
// delivery estimates, or map links.
export interface TrackingInput {
  simulated?: boolean;
  language?: SupportLanguage;
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
  const copy=ORDER_DETAIL_COPY[input.language??'EN'];
  if (input.simulated) return {
    steps: [
      { title: copy.testSaved, desc: copy.simulationOnly, completed: true },
      { title: copy.testPayment, desc: input.isPaid ? copy.noCharge : copy.simulationPending, completed: input.isPaid },
      { title: copy.noShipment, desc: copy.noDispatch, completed: false },
      { title: copy.testDelivery, desc: input.isDelivered ? copy.deliverySimulated : copy.simulationPending, completed: input.isDelivered },
    ],
    progress: input.isPaid ? 'processing' : 'placed',
    carrierStatus: copy.testShipping,
    carrierDetail: copy.simulationDetail,
    hasTracking: false,
  };

  const dispatched =
    input.isDelivered ||
    input.dispatchStatus === 'DISPATCHED' ||
    Boolean(input.trackingNumber);

  const steps: TrackingStep[] = [
    {
      title: copy.orderPlaced,
      desc: input.createdAt
        ? `${copy.placed} ${orderHistoryDate(input.createdAt,input.language??'EN')} UTC`
        : input.isPaid
          ? copy.confirmed
          : copy.pending,
      completed: true,
    },
    {
      title: input.language && input.language!=='EN' ? copy.processing.replace(/\.\.\.$/,'') : 'Processing',
      desc: input.isPaid ? copy.fulfillmentPending : copy.awaiting,
      completed: input.isPaid,
    },
    {
      title: copy.shipped,
      desc: dispatched
        ? input.trackingCarrier
          ? `${copy.dispatched} ${copy.via} ${input.trackingCarrier}`
          : copy.dispatched
        : copy.notDispatched,
      completed: dispatched,
    },
    {
      title: copy.delivered,
      desc: input.isDelivered ? copy.packageDelivered : copy.notDelivered,
      completed: input.isDelivered,
    },
  ];

  const hasTracking = Boolean(input.trackingNumber);
  const carrierStatus = input.isDelivered
    ? copy.delivered
    : dispatched
      ? copy.dispatched
      : copy.notDispatched;
  const carrierDetail = hasTracking
    ? `${copy.dispatched} ${copy.via} ${input.trackingCarrier || copy.carrierFallback} (${copy.tracking} #${input.trackingNumber})`
    : dispatched
      ? copy.missingTracking
      : copy.noTracking;

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
