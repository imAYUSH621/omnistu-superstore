import { prisma } from '@/db/prisma';
import type { FulfillmentSummary, SupplierDispatchResult } from './fulfillment-dispatcher';

/**
 * D4: persist supplier dispatch outcomes on the Order row so dispatch state
 * survives restarts and is visible to admin, tracking pages and sync jobs.
 */
export function aggregateDispatchStatus(dispatches: SupplierDispatchResult[]): string {
  if (dispatches.length === 0) return 'NO_ITEMS';
  const statuses = new Set(dispatches.map((d) => d.status));
  if (statuses.size === 1) return [...statuses][0];
  if (statuses.has('DISPATCHED')) return 'PARTIAL';
  return [...statuses].join('+');
}

export async function persistDispatchSummary(orderId: string, summary: FulfillmentSummary): Promise<void> {
  const join = (vals: (string | null)[]) => {
    const v = vals.filter((x): x is string => Boolean(x)).join(', ');
    return v.length > 0 ? v : null;
  };
  const errors = summary.dispatches
    .filter((d) => d.status !== 'DISPATCHED')
    .map((d) => `${d.supplier}: ${d.message}`)
    .join(' | ');

  await prisma.order.update({
    where: { id: orderId },
    data: {
      dispatchStatus: aggregateDispatchStatus(summary.dispatches),
      dispatchSupplier: join(summary.dispatches.map((d) => d.supplier)),
      supplierOrderId: join(summary.dispatches.map((d) => d.supplierOrderId)),
      trackingNumber: join(summary.dispatches.map((d) => d.trackingNumber)),
      trackingCarrier: join(summary.dispatches.map((d) => d.carrier)),
      dispatchedAt: summary.dispatches.some((d) => d.status === 'DISPATCHED') ? new Date() : null,
      dispatchError: errors.length > 0 ? errors : null,
    },
  });
}
