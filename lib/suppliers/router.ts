import { CjAdapter } from './cj-adapter';
import { PrintifyAdapter } from './printify-adapter';
import type { NormalizedProduct, SearchOptions, SupplierAdapter } from './types';

export interface SupplierSearchResult {
  products: NormalizedProduct[];
  errors: { supplier: string; message: string }[];
}

export function defaultAdapters(): SupplierAdapter[] {
  const adapters: SupplierAdapter[] = [];
  if (process.env.CJ_API_KEY) adapters.push(new CjAdapter());
  if (process.env.PRINTIFY_API_TOKEN && process.env.PRINTIFY_SHOP_ID) {
    adapters.push(new PrintifyAdapter());
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
