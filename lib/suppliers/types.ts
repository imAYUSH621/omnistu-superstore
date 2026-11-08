export type SupplierId = 'CJ' | 'PRINTIFY' | 'BRANDSGATEWAY' | 'SUNSKY' | 'BLANKA' | 'TRENDSI';

export interface NormalizedProduct {
  id: string; // internal id, e.g. "CJ-<supplier id>"
  supplier: SupplierId;
  supplierProductId: string;
  sku: string;
  title: string; // supplier title, lightly cleaned; no invented claims
  description: string;
  specs: string[]; // from supplier data only
  category: string;
  wholesaleCost: number | null; // USD reference cost; null means unknown
  retailPrice: number | null; // USD reference price, not permission to publish; null until qualified
  compareAtPrice: number | null; // only from a verifiable source
  images: string[];
  inStock: boolean | null; // null when inventory has not been independently checked
  stockQuantity: number | null;
  shippingNote: string;
}

export interface SearchOptions {
  page: number;
  limit: number;
}

export interface SupplierAdapter {
  readonly supplier: SupplierId;
  searchProducts(query: string, opts: SearchOptions): Promise<NormalizedProduct[]>;
  getProduct(supplierProductId: string): Promise<NormalizedProduct | null>;
}

export class SupplierError extends Error {
  constructor(
    public supplier: SupplierId,
    message: string,
    public status?: number,
  ) {
    super(`[${supplier}] ${message}`);
  }
}
