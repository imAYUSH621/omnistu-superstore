import { Offer } from './types';

/**
 * CJ (CJdropshipping) cached-offer adapter. Reads ONLY already-cached staging
 * data (scripts/stage-cj-products.mjs output / .cache/cj detail files); it
 * makes no provider calls and invents nothing:
 *   - variant identity is the supplier's own pid+vid, namespaced to the
 *     provider. Cross-provider equivalence ("the same variant from another
 *     supplier") is established ONLY by an explicit catalog mapping table,
 *     never by name or attribute similarity.
 *   - supplierReportedStock preserves totalInventory separately. Comparable stock
 *     requires an explicit origin and verified warehouse quantity; factory totals
 *     are never warehouse-ready stock. No snapshot is a reservation.
 *   - shipping is NOT part of the cached quote, so shippingCents stays
 *     undefined and the selector excludes these offers from total ranking
 *     until a freight quote exists. That fail-closed behaviour is intended.
 */

export interface CjStagingVariant {
  vid: string | number;
  sku?: string | null;
  name?: string | null;
  cost: number | null;                    // supplier sell price (USD)
  stockRaw?: { vid?:string|number; inventory?: Array<{ countryCode?:string; totalInventory?:number; cjInventory?:number; factoryInventory?:number; verifiedWarehouse?:number }> } | null;
}

export interface CjStagingItem {
  pid: string | number;
  variants: CjStagingVariant[];
  warehouseCountry?: string; // explicit qualification origin, never choose the first warehouse
  stockFetchedAt: string;                 // ISO timestamp of the cached fetch
}

export function cjVariantKey(pid: string | number, vid: string | number): string {
  const valid=(v:string|number)=>typeof v==='number'?Number.isSafeInteger(v)&&v>=0:!!v.trim()&&v===v.trim()&&!v.includes('|');
  if(!valid(pid)||!valid(vid))throw Error('INVALID_SUPPLIER_VARIANT_IDENTITY');
  return `cj|${String(pid)}|${String(vid)}`;
}

export function cjCachedOffers(item: CjStagingItem): Offer[] {
  const fetchedAt = new Date(item.stockFetchedAt);
  const out: Offer[] = [];
  const seen=new Set<string>();
  for (const v of item.variants ?? []) {
    const identity=cjVariantKey(item.pid,v.vid);
    if(seen.has(identity)||v.stockRaw?.vid!==undefined&&String(v.stockRaw.vid)!==String(v.vid))throw Error('AMBIGUOUS_SUPPLIER_VARIANT_IDENTITY');
    seen.add(identity);
    if (typeof v.cost!=='number'||!Number.isFinite(v.cost)||v.cost<0||!Number.isSafeInteger(Math.round(v.cost*100))) continue;
    const validQty=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
    const inventory=v.stockRaw?.inventory??[];
    const total=inventory.length&&inventory.every(i=>validQty(i.totalInventory))?inventory.reduce((n,i)=>n+i.totalInventory!,0):null;
    const rows=item.warehouseCountry?inventory.filter(i=>i.countryCode===item.warehouseCountry):[];
    const stock=rows.length===1&&rows[0].verifiedWarehouse===1&&validQty(rows[0].cjInventory)?rows[0].cjInventory:null;
    out.push({
      provider: 'cj',
      providerSku: String(v.sku ?? v.vid),
      variantKey: cjVariantKey(item.pid, v.vid),
      priceCents: Math.round(v.cost * 100),
      currency: 'USD',
      stock,
      supplierReportedStock:total!==null&&Number.isSafeInteger(total)?total:null,
      originCountry:item.warehouseCountry,
      fetchedAt,
      shippingCents: undefined, // cached quote carries no freight; excluded from ranking
    });
  }
  return out;
}
