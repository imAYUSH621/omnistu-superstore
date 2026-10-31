import {
  SupplierError,
  type NormalizedProduct,
  type SearchOptions,
  type SupplierAdapter,
} from './types';

const BASE = 'https://api.printify.com/v1';

interface PrintifyVariant {
  id: number;
  price: number; // cents, your retail price
  cost?: number; // cents, production cost (when present)
  is_enabled?: boolean;
  is_available?: boolean;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  images?: { src: string }[];
  variants?: PrintifyVariant[];
}

interface PrintifyPage {
  data: PrintifyProduct[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export class PrintifyAdapter implements SupplierAdapter {
  readonly supplier = 'PRINTIFY' as const;

  constructor(
    private token: string | undefined = process.env.PRINTIFY_API_TOKEN || process.env.PRINTIFY_API,
    private shopId: string | undefined = process.env.PRINTIFY_SHOP_ID,
  ) {}

  private async request<T>(path: string): Promise<T> {
    if (!this.token || !this.shopId) {
      throw new SupplierError('PRINTIFY', 'PRINTIFY_API_TOKEN / PRINTIFY_SHOP_ID not set');
    }
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      throw new SupplierError('PRINTIFY', res.statusText || 'request failed', res.status);
    }
    return (await res.json()) as T;
  }

  public normalize(p: PrintifyProduct): NormalizedProduct | null {
    const variants = (p.variants ?? []).filter((v) => v.is_enabled !== false);
    if (!variants.length) return null;
    const cheapest = variants.reduce((a, b) => (a.price <= b.price ? a : b));
    const retail = cheapest.price / 100;
    const cost = (cheapest.cost ?? cheapest.price) / 100;
    return {
      id: `PRINTIFY-${p.id}`,
      supplier: 'PRINTIFY',
      supplierProductId: p.id,
      sku: `PRINTIFY-${p.id}`,
      title: p.title.trim(),
      description: p.description ? stripHtml(p.description) : '',
      specs: [],
      category: p.tags?.[0] ?? 'Apparel & Merch',
      wholesaleCost: cost,
      retailPrice: retail,
      compareAtPrice: null,
      images: (p.images ?? []).map((i) => i.src),
      inStock: variants.some((v) => v.is_available !== false),
      stockQuantity: null,
      shippingNote:
        'Printed on demand by a Printify print provider. Production plus shipping time varies by provider and destination.',
    };
  }

  async searchProducts(query: string, opts: SearchOptions): Promise<NormalizedProduct[]> {
    const page = await this.request<PrintifyPage>(
      `/shops/${this.shopId}/products.json?page=${opts.page}&limit=${Math.min(opts.limit, 50)}`,
    );
    const q = query.trim().toLowerCase();
    return page.data
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.tags?.some((t) => t.toLowerCase().includes(q)))
      .map((p) => this.normalize(p))
      .filter((p): p is NormalizedProduct => p !== null);
  }

  async getProduct(supplierProductId: string): Promise<NormalizedProduct | null> {
    try {
      const p = await this.request<PrintifyProduct>(
        `/shops/${this.shopId}/products/${encodeURIComponent(supplierProductId)}.json`,
      );
      return this.normalize(p);
    } catch (e) {
      if (e instanceof SupplierError && e.status === 404) return null;
      throw e;
    }
  }
}
