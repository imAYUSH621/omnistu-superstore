export interface CloudOrderPayload {
  order_id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string | object;
  vendor?: string;
  product_id?: string;
  sku?: string;
  quantity?: number;
  total_usd: number;
  status?: string;
  tracking_number?: string | null;
  carrier?: string;
}

export async function syncOrderToSupabase(payload: CloudOrderPayload): Promise<{ success: boolean; mode: string }> {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key || url.includes('placeholder')) {
    return { success: true, mode: 'local_ledger' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        order_id: payload.order_id,
        customer_name: payload.customer_name || 'Guest Customer',
        customer_email: payload.customer_email || 'customer@omnistu.com',
        shipping_address: typeof payload.shipping_address === 'object' ? JSON.stringify(payload.shipping_address) : payload.shipping_address,
        vendor: payload.vendor || 'OMNISTU_CORE',
        product_id: payload.product_id,
        sku: payload.sku,
        quantity: payload.quantity || 1,
        total_usd: payload.total_usd,
        status: payload.status || 'PAID',
        tracking_number: payload.tracking_number || null,
        carrier: payload.carrier || 'Standard Priority',
        created_at: new Date().toISOString()
      })
    });

    if (res.ok) {
      return { success: true, mode: 'supabase_cloud' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Supabase Sync Error:', message);
  }

  return { success: false, mode: 'error' };
}
