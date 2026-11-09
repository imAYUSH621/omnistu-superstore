/**
 * Omnistu Superstore - Automated Supplier Order Dispatch Pipeline
 * Dispatches paid customer orders directly to CJ Dropshipping and Printify APIs.
 * Supports zero-crash fallback queueing and persistent tracking generation.
 */

import { dispatchPersistedSupplierOrder } from './bound-supplier-dispatch';


export interface DispatchItem {
  name: string;
  slug: string;
  qty: number;
  price: string | number;
  productId?: string;
  sku?: string;
}

export interface DispatchAddress {
  fullName?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export interface DispatchOrderInput {
  id: string;
  orderitems: DispatchItem[];
  shippingAddress: DispatchAddress;
  user?: {
    name?: string | null;
    email?: string | null;
  };
  totalPrice?: string | number;
}

export interface SupplierDispatchResult {
  supplier: 'UNRESOLVED' | 'CJ_DROPSHIPPING' | 'PRINTIFY' | 'SPECIALTY_GOURMET' | 'DIRECT_WAREHOUSE';
  // DISPATCHED = supplier API accepted the order. QUEUED = API attempt failed,
  // retry needed. SIMULATED = no supplier key configured, nothing was shipped.
  // UNROUTED = no supplier integration exists for this item group.
  status: 'DISPATCHED' | 'QUEUED' | 'SIMULATED' | 'UNROUTED' | 'ADDRESS_INCOMPLETE' | 'SPEND_BLOCKED' | 'SUPPLIER_ORDER_CREATED_UNPAID' | 'REVIEW_REQUIRED' | 'OFF';
  supplierOrderId: string | null;
  // Real tracking numbers only ever come from the supplier. Anything else is
  // null (unknown yet) - never an invented number (D3).
  trackingNumber: string | null;
  carrier: string | null;
  message: string;
  timestamp: string;
}

export interface AddressValidation {
  ok: boolean;
  missing: string[];
}

/**
 * D5: a supplier dispatch requires a complete, real shipping address.
 * Returns the list of missing fields instead of silently substituting
 * fabricated defaults like '123 Main St' or '5551234567'.
 */
export function validateDispatchAddress(shipping: DispatchAddress | undefined | null): AddressValidation {
  const required: (keyof DispatchAddress)[] = ['streetAddress', 'city', 'postalCode', 'country', 'phone'];
  const missing = required.filter((f) => {
    const v = shipping?.[f];
    return !v || String(v).trim().length === 0;
  });
  return { ok: missing.length === 0, missing };
}

export interface FulfillmentSummary {
  orderId: string;
  success: boolean;
  dispatches: SupplierDispatchResult[];
}

/** Legacy callers cannot supply a routing override: only the order ID reaches
 * the shared persisted source. Missing bindings never obtain default mappings. */
export async function dispatchOrderFulfillment(order:DispatchOrderInput):Promise<FulfillmentSummary>{
 const result=await dispatchPersistedSupplierOrder(order.id);
 return{orderId:order.id,success:false,dispatches:[{supplier:result.status==='OFF'?'UNRESOLVED':'CJ_DROPSHIPPING',status:result.status,supplierOrderId:result.supplierOrderId,trackingNumber:null,carrier:null,message:result.status==='SUPPLIER_ORDER_CREATED_UNPAID'?'Supplier order created unpaid; not funded, dispatched or delivered':'Supplier order requires review or is off',timestamp:new Date().toISOString()}]};
}
