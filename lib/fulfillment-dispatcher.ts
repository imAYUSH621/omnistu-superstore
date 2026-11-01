/**
 * Omnistu Superstore - Automated Supplier Order Dispatch Pipeline
 * Dispatches paid customer orders directly to CJ Dropshipping and Printify APIs.
 * Supports zero-crash fallback queueing and persistent tracking generation.
 */

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

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
  supplier: 'CJ_DROPSHIPPING' | 'PRINTIFY' | 'SPECIALTY_GOURMET' | 'DIRECT_WAREHOUSE';
  // DISPATCHED = supplier API accepted the order. QUEUED = API attempt failed,
  // retry needed. SIMULATED = no supplier key configured, nothing was shipped.
  // UNROUTED = no supplier integration exists for this item group.
  status: 'DISPATCHED' | 'QUEUED' | 'SIMULATED' | 'UNROUTED' | 'ADDRESS_INCOMPLETE';
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

/**
 * Obtain CJ Dropshipping access token using configured API key.
 */
let cachedCJToken: string | null = null;
let cjTokenExpiry = 0;

export async function getCJToken(): Promise<string | null> {
  const apiKey = process.env.CJ_API_KEY || process.env.FULFILLMENT_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) return null;

  const now = Date.now();
  if (cachedCJToken && now < cjTokenExpiry) return cachedCJToken;

  try {
    const resp = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    const data = await resp.json();
    if (data.result && data.data?.accessToken) {
      cachedCJToken = data.data.accessToken;
      cjTokenExpiry = now + 14 * 86400 * 1000;
      return cachedCJToken;
    }
  } catch (err: unknown) {
    console.error('CJ Token Retrieval Error:', err instanceof Error ? err.message : String(err));
  }
  return null;
}

/**
 * Dispatches an order to suppliers upon successful payment.
 */
export async function dispatchOrderFulfillment(order: DispatchOrderInput): Promise<FulfillmentSummary> {
  const dispatches: SupplierDispatchResult[] = [];
  const cjItems: DispatchItem[] = [];
  const printifyItems: DispatchItem[] = [];
  const gourmetItems: DispatchItem[] = [];

  for (const item of order.orderitems || []) {
    const slug = (item.slug || '').toLowerCase();
    if (slug.includes('hoodie') || slug.includes('tee') || slug.includes('printify') || slug.includes('denim')) {
      printifyItems.push(item);
    } else if (slug.includes('saffron') || slug.includes('chai') || slug.includes('spice') || slug.includes('tea') || slug.includes('ghee') || slug.includes('mango') || slug.includes('basmati')) {
      gourmetItems.push(item);
    } else {
      cjItems.push(item);
    }
  }

  const shipping = order.shippingAddress || {};

  // D5: refuse to dispatch against an incomplete address rather than
  // falling back to fabricated placeholders.
  const addressCheck = validateDispatchAddress(shipping);
  if (!addressCheck.ok) {
    return {
      orderId: order.id,
      success: false,
      dispatches: [{
        supplier: 'DIRECT_WAREHOUSE',
        status: 'ADDRESS_INCOMPLETE',
        supplierOrderId: null,
        trackingNumber: null,
        carrier: null,
        message: `Dispatch blocked: shipping address is missing ${addressCheck.missing.join(', ')}. Collect the real address from the customer before dispatch.`,
        timestamp: new Date().toISOString(),
      }],
    };
  }

  const customerName = shipping.fullName || order.user?.name || 'Customer';
  const customerEmail = order.user?.email || '';

  // 1. Dispatch Printify on-demand items
  if (printifyItems.length > 0) {
    const printifyToken = process.env.PRINTIFY_API || process.env.PRINTIFY_TOKEN;
    const printifyShopId = process.env.PRINTIFY_SHOP_ID;

    if (printifyToken && printifyShopId && !printifyToken.includes('placeholder')) {
      try {
        const payload = {
          external_id: `${order.id}-PRT`,
          label: `Omnistu Direct — ${order.id}`,
          line_items: printifyItems.map((pi) => ({
            product_id: pi.productId || '6ae20089e5cd851f5d0f80ec',
            variant_id: 11812,
            quantity: pi.qty || 1,
          })),
          shipping_method: 1,
          send_shipping_notification: true,
          address_to: {
            first_name: customerName.split(' ')[0] || 'Valued',
            last_name: customerName.split(' ').slice(1).join(' ') || 'Customer',
            email: customerEmail,
            phone: shipping.phone,
            country: shipping.country,
            address1: shipping.streetAddress,
            city: shipping.city,
            zip: shipping.postalCode,
          },
        };

        const res = await fetch(`https://api.printify.com/v1/shops/${printifyShopId}/orders.json`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${printifyToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const pData = await res.json();
        dispatches.push({
          supplier: 'PRINTIFY',
          status: res.ok ? 'DISPATCHED' : 'QUEUED',
          supplierOrderId: pData.id || null,
          trackingNumber: null, // Printify assigns tracking later; fetched by the sync job
          carrier: null,
          message: res.ok
            ? 'Order submitted to Printify print lab; tracking appears once Printify assigns it'
            : `Printify dispatch failed, queued for retry: ${pData.message || res.status}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: unknown) {
        dispatches.push({
          supplier: 'PRINTIFY',
          status: 'QUEUED',
          supplierOrderId: null,
          trackingNumber: null,
          carrier: null,
          message: `Printify dispatch error, queued for retry: ${err instanceof Error ? err.message : String(err)}`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      dispatches.push({
        supplier: 'PRINTIFY',
        status: 'SIMULATED',
        supplierOrderId: null,
        trackingNumber: null,
        carrier: null,
        message: 'SIMULATED only: no Printify credentials configured, so nothing was ordered or shipped. Set PRINTIFY_API and PRINTIFY_SHOP_ID for real dispatch.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 2. Dispatch CJ Dropshipping items
  if (cjItems.length > 0) {
    const cjToken = await getCJToken();
    if (cjToken) {
      try {
        const cjOrderBody = {
          orderNumber: `${order.id}-CJ`,
          shippingZip: shipping.postalCode || '94105',
          shippingCountry: shipping.country === 'IN' ? 'India' : 'United States',
          shippingCountryCode: shipping.country || 'US',
          fromCountryCode: 'CN',
          logisticName: shipping.country === 'IN' ? 'CJ Packet Special Line' : 'USPS',
          shippingCustomerName: customerName,
          shippingAddress: shipping.streetAddress || '123 Market St',
          shippingCity: shipping.city || 'San Francisco',
          shippingProvince: 'CA',
          shippingPhone: shipping.phone || '5551234567',
          products: cjItems.map((ci) => ({
            sku: ci.sku || 'CJYD223039801AZ-100G',
            quantity: ci.qty || 1,
          })),
        };

        const res = await fetch(`${CJ_BASE_URL}/shopping/order/createOrderV2`, {
          method: 'POST',
          headers: {
            'CJ-Access-Token': cjToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cjOrderBody),
        });

        const cData = await res.json();
        dispatches.push({
          supplier: 'CJ_DROPSHIPPING',
          status: cData.result ? 'DISPATCHED' : 'QUEUED',
          supplierOrderId: cData.data?.orderId || null,
          trackingNumber: cData.data?.trackingNumber || null, // real value only, when CJ returns one
          carrier: cData.result ? (shipping.country === 'IN' ? 'CJ Packet' : 'USPS') : null,
          message: cData.result
            ? 'Order placed in CJ Dropshipping system; tracking syncs once CJ assigns it'
            : `CJ dispatch failed, queued for retry: ${cData.message || res.status}`,
          timestamp: new Date().toISOString(),
        });
      } catch (cjErr: unknown) {
        dispatches.push({
          supplier: 'CJ_DROPSHIPPING',
          status: 'QUEUED',
          supplierOrderId: null,
          trackingNumber: null,
          carrier: null,
          message: `CJ dispatch error, queued for retry: ${cjErr instanceof Error ? cjErr.message : String(cjErr)}`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      dispatches.push({
        supplier: 'CJ_DROPSHIPPING',
        status: 'SIMULATED',
        supplierOrderId: null,
        trackingNumber: null,
        carrier: null,
        message: 'SIMULATED only: no CJ API key configured, so nothing was ordered or shipped. Set CJ_API_KEY for real dispatch.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 3. Gourmet & Indian Food items: no supplier integration exists for this
  // group, so report it honestly instead of fabricating a dispatch (D3).
  if (gourmetItems.length > 0) {
    dispatches.push({
      supplier: 'SPECIALTY_GOURMET',
      status: 'UNROUTED',
      supplierOrderId: null,
      trackingNumber: null,
      carrier: null,
      message: 'No fulfillment integration exists for gourmet items yet; route manually or wire a supplier before launch.',
      timestamp: new Date().toISOString(),
    });
  }

  return {
    orderId: order.id,
    success: dispatches.every((d) => d.status === 'DISPATCHED'),
    dispatches,
  };
}
