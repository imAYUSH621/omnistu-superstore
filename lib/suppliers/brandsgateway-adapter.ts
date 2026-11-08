import { parseReferenceCost } from './reference-cost';
import {
  SupplierError,
  type NormalizedProduct,
  type SearchOptions,
  type SupplierAdapter,
} from './types';

// BrandsGateway B2B luxury dropshipping (Designer Jewelry, Watches & High Fashion)
// Docs: https://api.brandsgateway.com/
const BASE = 'https://api.brandsgateway.com/v2';

const SHIPPING_NOTE =
  'Reference listing only. Exact variant stock, fulfillment source, packaging, destination freight and processing time require independent qualification.';

interface BrandsGatewayProduct {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  wholesale_price?: number | string;
  retail_price?: number | string;
  images?: string[];
  brand?: string;
  category?: string;
  sku?: string;
}

interface BrandsGatewayResponse {
  products?: BrandsGatewayProduct[];
  data?: BrandsGatewayProduct[];
}

export class BrandsGatewayAdapter implements SupplierAdapter {
  readonly supplier = 'BRANDSGATEWAY' as const;

  constructor(
    private readonly apiKey: string | undefined = process.env.BRANDSGATEWAY_API_KEY,
    // Kept as an ignored compatibility argument; never evidence of freight.
    shippingEstimateUsd?: number,
  ) { void shippingEstimateUsd; }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey || ''}`,
      'Content-Type': 'application/json',
      'User-Agent': 'OmnistuSuperstore/1.0',
    };
  }

  public normalize(product: BrandsGatewayProduct): NormalizedProduct {
    const cost = parseReferenceCost(product.wholesale_price);
    // A supplier recommended price is not a qualified store retail price.
    const id = String(product.id);
    const brandPrefix = product.brand ? `${product.brand.toUpperCase()} - ` : '';

    return {
      id: `BG-${id}`,
      supplier: 'BRANDSGATEWAY',
      supplierProductId: id,
      sku: product.sku || `BG-${id}`,
      title: `${brandPrefix}${(product.name || product.title || '').trim()}`,
      description: (product.description || '').trim(),
      specs: product.brand ? [`Brand: ${product.brand}`] : [],
      category: product.category || 'Luxury & Fine Jewelry',
      wholesaleCost: cost,
      retailPrice: null,
      compareAtPrice: null,
      images: (product.images || []).filter(Boolean),
      inStock: null,
      stockQuantity: null,
      shippingNote: SHIPPING_NOTE,
    };
  }

  async searchProducts(query: string, opts: SearchOptions): Promise<NormalizedProduct[]> {
    if (!this.apiKey) return [];
    try {
      const qs = new URLSearchParams({
        search: query,
        page: String(opts.page),
        per_page: String(opts.limit),
      });
      const res = await fetch(`${BASE}/products?${qs}`, { headers: this.headers });
      if (!res.ok) {
        throw new SupplierError('BRANDSGATEWAY', res.statusText || 'request failed', res.status);
      }
      const json = (await res.json()) as BrandsGatewayResponse;
      const list = json.products || json.data || [];
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
      if (!res.ok) throw new SupplierError('BRANDSGATEWAY', res.statusText, res.status);
      const data = (await res.json()) as { product?: BrandsGatewayProduct; data?: BrandsGatewayProduct };
      const product = data.product || data.data;
      return product ? this.normalize(product) : null;
    } catch (e) {
      if (e instanceof SupplierError && e.status === 404) return null;
      return null;
    }
  }
}
