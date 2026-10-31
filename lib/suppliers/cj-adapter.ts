import { priceFor } from '../pricing';
import {
  SupplierError,
  type NormalizedProduct,
  type SearchOptions,
  type SupplierAdapter,
} from './types';

// Written from CJ's public API v2.0 docs.
const BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

interface CjEnvelope<T> {
  code: number;
  result: boolean;
  message?: string;
  data: T;
}

interface CjListItem {
  pid: string;
  productNameEn?: string;
  productName?: string;
  productImage?: string;
  sellPrice?: string | number;
  categoryName?: string;
  productSku?: string;
}

interface CjDetail extends CjListItem {
  description?: string;
  productImageSet?: string[] | string;
  productWeight?: string | number;
}

interface TokenData {
  accessToken: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// CJ may return a range like "1.20 -- 3.40". Use the highest value so cost is never understated.
export function parseCost(v: string | number | undefined): number {
  if (typeof v === 'number') return v;
  const nums = (v ?? '').match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  return nums.length ? Math.max(...nums) : 0;
}

export class CjAdapter implements SupplierAdapter {
  readonly supplier = 'CJ' as const;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private apiKey: string | undefined = process.env.CJ_API_KEY || process.env.FULFILLMENT_API_KEY,
    private shippingEstimateUsd = 4,
  ) {}

  private async getToken(force = false): Promise<string> {
    if (!this.apiKey) throw new SupplierError('CJ', 'CJ_API_KEY is not set');
    if (!force && this.token && this.token.expiresAt > Date.now()) return this.token.value;

    const res = await fetch(`${BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.apiKey }),
    });
    const json = (await res.json()) as CjEnvelope<TokenData>;
    if (!res.ok || !json.result || !json.data?.accessToken) {
      throw new SupplierError('CJ', `auth failed: ${json.message ?? res.statusText}`, res.status);
    }
    // Cache for 12h; CJ rate-limits token requests
    this.token = { value: json.data.accessToken, expiresAt: Date.now() + 12 * 3600 * 1000 };
    return this.token.value;
  }

  private async request<T>(path: string, retry = true): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${BASE}${path}`, { headers: { 'CJ-Access-Token': token } });
    if (res.status === 401 && retry) {
      await this.getToken(true);
      return this.request<T>(path, false);
    }
    const json = (await res.json()) as CjEnvelope<T>;
    if (!res.ok || !json.result) {
      throw new SupplierError('CJ', json.message ?? res.statusText, res.status);
    }
    return json.data;
  }

  public normalize(item: CjDetail): NormalizedProduct {
    const cost = parseCost(item.sellPrice);
    const { retailPrice } = priceFor(cost, this.shippingEstimateUsd);
    const images: string[] = [];
    if (item.productImage) images.push(item.productImage);
    if (Array.isArray(item.productImageSet)) images.push(...item.productImageSet);
    return {
      id: `CJ-${item.pid}`,
      supplier: 'CJ',
      supplierProductId: item.pid,
      sku: item.productSku ?? `CJ-${item.pid}`,
      title: (item.productNameEn ?? item.productName ?? '').trim(),
      description: item.description ? stripHtml(item.description) : '',
      specs: [],
      category: item.categoryName ?? 'Uncategorized',
      wholesaleCost: cost,
      retailPrice,
      compareAtPrice: null,
      images: [...new Set(images)],
      inStock: true,
      stockQuantity: null,
      shippingNote:
        'Ships from the supplier. Delivery time depends on destination; confirm with CJ before quoting a date.',
    };
  }

  async searchProducts(query: string, opts: SearchOptions): Promise<NormalizedProduct[]> {
    const qs = new URLSearchParams({
      pageNum: String(opts.page),
      pageSize: String(opts.limit),
      productName: query,
    });
    const data = await this.request<{ list?: CjListItem[] }>(`/product/list?${qs}`);
    return (data.list ?? []).map((i) => this.normalize(i));
  }

  async getProduct(supplierProductId: string): Promise<NormalizedProduct | null> {
    try {
      const data = await this.request<CjDetail>(
        `/product/query?pid=${encodeURIComponent(supplierProductId)}`,
      );
      return data?.pid ? this.normalize(data) : null;
    } catch (e) {
      if (e instanceof SupplierError && e.status === 404) return null;
      throw e;
    }
  }
}
