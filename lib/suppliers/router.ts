import { CjAdapter } from './cj-adapter';
import { PrintifyAdapter } from './printify-adapter';
import { BlankaAdapter } from './blanka-adapter';
import { TrendsiAdapter } from './trendsi-adapter';
import { BrandsGatewayAdapter } from './brandsgateway-adapter';
import type { NormalizedProduct, SearchOptions, SupplierAdapter } from './types';

export interface SupplierSearchResult {
  products: NormalizedProduct[];
  errors: { supplier: string; message: string }[];
}

export function defaultAdapters(): SupplierAdapter[] {
  const adapters: SupplierAdapter[] = [];

  // 1. CJ Dropshipping (General Catalog, Tech, Home, Sensory Gadgets)
  const cjKey = process.env.CJ_API_KEY || process.env.FULFILLMENT_API_KEY;
  if (cjKey) adapters.push(new CjAdapter(cjKey));

  // 2. Printify (Print-On-Demand Streetwear & Merch)
  const printifyToken = process.env.PRINTIFY_API_TOKEN || process.env.PRINTIFY_API;
  const printifyShop = process.env.PRINTIFY_SHOP_ID;
  if (printifyToken && printifyShop) {
    adapters.push(new PrintifyAdapter(printifyToken, printifyShop));
  }

  // 3. Blanka (Private-Label Face Wash, Organic Soaps, Serums)
  const blankaKey = process.env.BLANKA_API_KEY;
  if (blankaKey) {
    adapters.push(new BlankaAdapter(blankaKey));
  }

  // 4. Trendsi (US Warehoused Fast Fashion & Women's Apparel)
  const trendsiKey = process.env.TRENDSI_API_KEY;
  if (trendsiKey) {
    adapters.push(new TrendsiAdapter(trendsiKey));
  }

  // 5. BrandsGateway (Authentic Luxury Jewelry & Watches)
  const brandsgatewayKey = process.env.BRANDSGATEWAY_API_KEY;
  if (brandsgatewayKey) {
    adapters.push(new BrandsGatewayAdapter(brandsgatewayKey));
  }

  return adapters;
}

/**
 * Queries every adapter in parallel. One failing supplier does not fail the
 * whole search; its error is reported next to the results.
 */
export async function searchAllSuppliers(
  query: string,
  opts: SearchOptions,
  adapters: SupplierAdapter[] = defaultAdapters(),
): Promise<SupplierSearchResult> {
  const settled = await Promise.allSettled(adapters.map((a) => a.searchProducts(query, opts)));

  const products: NormalizedProduct[] = [];
  const errors: SupplierSearchResult['errors'] = [];
  const seen = new Set<string>();

  settled.forEach((result, i) => {
    const supplier = adapters[i].supplier;
    if (result.status === 'rejected') {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({ supplier, message });
      return;
    }
    for (const p of result.value) {
      const key = `${p.supplier}:${p.supplierProductId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      products.push(p);
    }
  });

  return { products, errors };
}
