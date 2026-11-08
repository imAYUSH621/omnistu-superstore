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

// CJ list prices can be ranges. The upper endpoint is a reference cost, not
// an exact variant quote. Missing or malformed evidence must never become zero.
export function parseCost(v: string | number | undefined): number | null {
  const valid = (n: number) => Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER / 100;
  if (typeof v === 'number') return valid(v) ? v : null;
  if (typeof v !== 'string' || !/^\s*\d+(?:\.\d+)?(?:\s*--\s*\d+(?:\.\d+)?)?\s*$/.test(v)) return null;
  const nums = v.trim().split(/\s*--\s*/).map(Number);
  return nums.every(valid) ? Math.max(...nums) : null;
}

export class CjAdapter implements SupplierAdapter {
  readonly supplier = 'CJ' as const;
  private token: { value: string; expiresAt: number } | null = null;

  constructor(
    private apiKey: string | undefined = process.env.CJ_API_KEY || process.env.FULFILLMENT_API_KEY,
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
      retailPrice: null, // no exact destination freight, merchant costs or retail approval
      compareAtPrice: null,
      images: [...new Set(images)],
      inStock: null, // listing/detail responses do not prove stock or dispatch readiness
      stockQuantity: null,
      shippingNote:
        'Reference listing only. Exact variant stock, fulfillment source, destination freight and processing time require independent qualification.',
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
