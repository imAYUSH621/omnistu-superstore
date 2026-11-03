import { Offer } from './types';

/**
 * CJ (CJdropshipping) cached-offer adapter. Reads ONLY already-cached staging
 * data (scripts/stage-cj-products.mjs output / .cache/cj detail files); it
 * makes no provider calls and invents nothing:
 *   - variant identity is the supplier's own pid+vid, namespaced to the
 *     provider. Cross-provider equivalence ("the same variant from another
 *     supplier") is established ONLY by an explicit catalog mapping table,
 *     never by name or attribute similarity.
 *   - stock is the supplier's variant totalInventory at fetch time - a
 *     snapshot, not a reservation.
 *   - shipping is NOT part of the cached quote, so shippingCents stays
 *     undefined and the selector excludes these offers from total ranking
 *     until a freight quote exists. That fail-closed behaviour is intended.
 */

export interface CjStagingVariant {
  vid: string | number;
  sku?: string | null;
  name?: string | null;
  cost: number | null;                    // supplier sell price (USD)
  stockRaw?: { inventory?: Array<{ totalInventory?: number }> } | null;
}

export interface CjStagingItem {
  pid: string | number;
  variants: CjStagingVariant[];
  stockFetchedAt: string;                 // ISO timestamp of the cached fetch
}

export function cjVariantKey(pid: string | number, vid: string | number): string {
  return `cj|${String(pid)}|${String(vid)}`;
}

export function cjCachedOffers(item: CjStagingItem): Offer[] {
  const fetchedAt = new Date(item.stockFetchedAt);
  const out: Offer[] = [];
  for (const v of item.variants ?? []) {
    if (v.cost === null || v.cost === undefined) continue; // no quote, no offer
    const stock = (v.stockRaw?.inventory ?? []).reduce(
      (a, c) => a + (Number(c?.totalInventory) || 0),
      0
    );
    out.push({
      provider: 'cj',
      providerSku: String(v.sku ?? v.vid),
      variantKey: cjVariantKey(item.pid, v.vid),
      priceCents: Math.round(v.cost * 100),
      currency: 'USD',
      stock,
      fetchedAt,
      shippingCents: undefined, // cached quote carries no freight; excluded from ranking
    });
  }
  return out;
}
