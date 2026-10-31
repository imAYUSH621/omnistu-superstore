import { priceFor } from '../pricing';
import {
  SupplierError,
  type NormalizedProduct,
  type SearchOptions,
  type SupplierAdapter,
} from './types';

// Blanka private-label skincare/wellness dropshipper
// Docs: https://app.blanka.io/settings/api
const BASE = 'https://app.blanka.io/api/v1';

const SHIPPING_NOTE =
  'White-label private-label skincare. Ships in Omnistu Botanics branded packaging from US warehouse. 5-7 business days.';

interface BlankaImage {
  src: string;
}

interface BlankaVariant {
  id: string | number;
  sku?: string;
}

interface BlankaProduct {
  id: string | number;
  title?: string;
  description?: string;
  wholesale_price?: number;
  images?: BlankaImage[];
  product_type?: string;
  variants?: BlankaVariant[];
}

interface BlankaListResponse {
  results?: BlankaProduct[];
  // Blanka may also return a top-level array; handle both shapes
  [key: string]: unknown;
}

export class BlankaAdapter implements SupplierAdapter {
  readonly supplier = 'BLANKA' as const;

  constructor(
    private readonly apiKey: string | undefined = process.env.BLANKA_API_KEY,
    private readonly shippingEstimateUsd = 6,
  ) {}

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(path: string): Promise<T> {
    if (!this.apiKey) {
      throw new SupplierError('BLANKA', 'BLANKA_API_KEY is not set');
    }
    const res = await fetch(`${BASE}${path}`, { headers: this.headers });
    if (!res.ok) {
      throw new SupplierError('BLANKA', res.statusText || 'request failed', res.status);
    }
    return (await res.json()) as T;
  }

  public normalize(product: BlankaProduct): NormalizedProduct {
    const cost = Number(product.wholesale_price) || 0;
    const { retailPrice } = priceFor(cost, this.shippingEstimateUsd);
    const id = String(product.id);
    const firstVariantSku = product.variants?.[0]?.sku ?? `BLANKA-${id}`;
    return {
      id: `BLANKA-${id}`,
      supplier: 'BLANKA',
      supplierProductId: id,
      sku: firstVariantSku,
      title: (product.title ?? '').trim(),
      description: (product.description ?? '').trim(),
      specs: [],
      category: product.product_type ?? 'Skincare & Wellness',
      wholesaleCost: cost,
      retailPrice,
      compareAtPrice: null,
      images: (product.images ?? []).map((img) => img.src).filter(Boolean),
      inStock: true,
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
      const data = await this.request<BlankaListResponse>(`/products?${qs}`);
      // Blanka may return { results: [] } or a bare array
      const list: BlankaProduct[] = Array.isArray(data)
        ? (data as BlankaProduct[])
        : ((data.results as BlankaProduct[]) ?? []);
      return list.map((p) => this.normalize(p));
    } catch (e) {
      if (e instanceof SupplierError) throw e;
      throw new SupplierError('BLANKA', e instanceof Error ? e.message : String(e));
    }
  }

  async getProduct(supplierProductId: string): Promise<NormalizedProduct | null> {
    if (!this.apiKey) return null;
    try {
      const product = await this.request<BlankaProduct>(
        `/products/${encodeURIComponent(supplierProductId)}`,
      );
      return product?.id != null ? this.normalize(product) : null;
    } catch (e) {
      if (e instanceof SupplierError && e.status === 404) return null;
      throw e;
    }
  }
}
