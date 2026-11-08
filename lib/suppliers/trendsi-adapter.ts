import { parseReferenceCost } from './reference-cost';
import {
  SupplierError,
  type NormalizedProduct,
  type SearchOptions,
  type SupplierAdapter,
} from './types';

// Trendsi US-warehoused fashion dropshipper
// Docs: https://api.trendsi.com/
const BASE = 'https://api.trendsi.com/api/v1';

const SHIPPING_NOTE =
  'Reference listing only. Exact variant stock, fulfillment source, packaging, destination freight and processing time require independent qualification.';

interface TrendsiProduct {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  price?: string | number;
  wholesale_price?: string | number;
  images?: Array<{ url: string } | string>;
  category?: string;
  sku?: string;
}

interface TrendsiSearchResponse {
  data?: {
    products?: TrendsiProduct[];
  };
  products?: TrendsiProduct[];
}

export class TrendsiAdapter implements SupplierAdapter {
  readonly supplier = 'TRENDSI' as const;

  constructor(
    private readonly apiKey: string | undefined = process.env.TRENDSI_API_KEY,
    // Kept as an ignored compatibility argument; never evidence of freight.
    shippingEstimateUsd?: number,
  ) { void shippingEstimateUsd; }

  private get headers(): Record<string, string> {
    return {
      'X-Api-Key': this.apiKey || '',
      'Content-Type': 'application/json',
      'User-Agent': 'OmnistuSuperstore/1.0',
    };
  }

  public normalize(product: TrendsiProduct): NormalizedProduct {
    const cost = parseReferenceCost(product.wholesale_price ?? product.price);
    const id = String(product.id);

    const images: string[] = [];
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (typeof img === 'string') images.push(img);
        else if (img && typeof img === 'object' && 'url' in img) images.push(img.url);
      }
    }

    return {
      id: `TRENDSI-${id}`,
      supplier: 'TRENDSI',
      supplierProductId: id,
      sku: product.sku || `TRENDSI-${id}`,
      title: (product.title || product.name || '').trim(),
      description: (product.description || '').trim(),
      specs: [],
      category: product.category || "Women's Fashion",
      wholesaleCost: cost,
      retailPrice: null,
      compareAtPrice: null,
      images: images.filter(Boolean),
      inStock: null,
      stockQuantity: null,
      shippingNote: SHIPPING_NOTE,
    };
  }

  async searchProducts(query: string, opts: SearchOptions): Promise<NormalizedProduct[]> {
    if (!this.apiKey) return [];
    try {
      const qs = new URLSearchParams({
        q: query,
        page: String(opts.page),
        limit: String(opts.limit),
      });
      const res = await fetch(`${BASE}/products?${qs}`, { headers: this.headers });
      if (!res.ok) {
        throw new SupplierError('TRENDSI', res.statusText || 'request failed', res.status);
      }
      const json = (await res.json()) as TrendsiSearchResponse;
      const list = json.data?.products || json.products || [];
      return list.map((p) => this.normalize(p));
    } catch (e) {
      if (e instanceof SupplierError) throw e;
      return [];
    }
  }

  async getProduct(supplierProductId: string): Promise<NormalizedProduct | null> {
    if (!this.apiKey) return null;
    try {
      const res = await fetch(`${BASE}/products/${encodeURIComponent(supplierProductId)}`, {
        headers: this.headers,
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new SupplierError('TRENDSI', res.statusText, res.status);
      const data = (await res.json()) as { product?: TrendsiProduct; data?: TrendsiProduct };
      const product = data.product || data.data;
      return product ? this.normalize(product) : null;
    } catch (e) {
      if (e instanceof SupplierError && e.status === 404) return null;
      return null;
    }
  }
}
