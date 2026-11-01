// D11: fail-closed spend guard for supplier dispatch.
//
// A paid checkout can trigger real supplier orders that cost real money.
// The guard blocks dispatch unless the operator has configured explicit
// monetary caps via env. Limits are never invented or defaulted: with no
// cap configured, dispatch is refused (fail closed). Autonomy stays off;
// this only gates the already-manual dispatch paths.
//
// Configuration (operator-set, documented in .example-env):
//   FULFILLMENT_MAX_ORDER_TOTAL_USD - max order total eligible for dispatch
//   FULFILLMENT_MAX_ITEM_QTY        - max quantity of any single line item
// Both must be set and parse as positive finite numbers, or dispatch blocks.

export interface SpendGuardResult {
  ok: boolean;
  reason?: string;
}

function parsePositive(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function assertDispatchSpendAllowed(order: {
  totalPrice?: string | number;
  orderitems?: { qty?: number }[];
}): SpendGuardResult {
  const maxTotal = parsePositive(process.env.FULFILLMENT_MAX_ORDER_TOTAL_USD);
  const maxQty = parsePositive(process.env.FULFILLMENT_MAX_ITEM_QTY);
  if (maxTotal === null || maxQty === null) {
    return {
      ok: false,
      reason:
        'No spend caps configured (FULFILLMENT_MAX_ORDER_TOTAL_USD / FULFILLMENT_MAX_ITEM_QTY). Dispatch stays blocked until the operator sets explicit limits - caps are never invented.',
    };
  }
  const total = Number(order.totalPrice ?? NaN);
  if (!Number.isFinite(total) || total < 0) {
    return { ok: false, reason: 'Order total is unknown; refusing dispatch (fail closed).' };
  }
  if (total > maxTotal) {
    return {
      ok: false,
      reason: `Order total $${total.toFixed(2)} exceeds configured cap $${maxTotal.toFixed(2)}; manual review required before dispatch.`,
    };
  }
  for (const item of order.orderitems || []) {
    const qty = Number(item.qty ?? NaN);
    if (!Number.isFinite(qty) || qty < 1) {
      return { ok: false, reason: 'A line item has unknown quantity; refusing dispatch (fail closed).' };
    }
    if (qty > maxQty) {
      return {
        ok: false,
        reason: `Line item quantity ${qty} exceeds configured cap ${maxQty}; manual review required before dispatch.`,
      };
    }
  }
  return { ok: true };
}
