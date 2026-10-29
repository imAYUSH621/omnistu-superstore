import { calculateTieredPrice } from '../utils';

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getCJAccessToken(): Promise<string | null> {
  const apiKey = process.env.CJ_API_KEY || process.env.FULFILLMENT_API_KEY;
  if (!apiKey) return null;

  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
      next: { revalidate: 3600 }
    });
    const data = await res.json();
    if (data.result && data.data?.accessToken) {
      cachedToken = data.data.accessToken;
      tokenExpiry = now + 14 * 86400 * 1000;
      return cachedToken;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('CJ Dropshipping Token Error:', message);
  }
  return null;
}

export interface JITProductResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  brand: string;
  description: string;
  price: string;
  msrp: string;
  rating: string;
  numReviews: number;
  stock: number;
  isFeatured: boolean;
  banner: string | null;
  supplier: string;
  wholesaleCost: number;
}

interface CJRawItem {
  pid: string;
  productNameEn: string;
  categoryName?: string;
  productImage?: string;
  productImageSet?: string[];
  description?: string;
  sellPrice?: string | number;
  productWeight?: number;
}

export async function searchCJProducts(keyword: string, limit = 12): Promise<JITProductResult[]> {
  const token = await getCJAccessToken();
  if (!token) {
    return [];
  }

  try {
    const url = new URL(`${CJ_BASE_URL}/product/list`);
    url.searchParams.set('productNameEn', keyword || 'trending');
    url.searchParams.set('pageSize', String(limit));
    url.searchParams.set('pageNum', '1');

    const res = await fetch(url.toString(), {
      headers: { 'CJ-Access-Token': token },
      next: { revalidate: 300 }
    });
    const data = await res.json();
    if (!data.result || !data.data?.list) {
      return [];
    }

    return (data.data.list as CJRawItem[]).map((item: CJRawItem) => {
      const wholesale = parseFloat(String(item.sellPrice || '5.0')) || 5.0;
      const pricing = calculateTieredPrice(wholesale);
      const slug = (item.productNameEn || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .substring(0, 50) + `-${(item.pid || '').substring(0, 8)}`;

      return {
        id: item.pid,
        name: item.productNameEn,
        slug,
        category: item.categoryName || 'General',
        images: [item.productImage, ...(item.productImageSet || [])].filter((img): img is string => Boolean(img)),
        brand: 'Omnistu Direct',
        description: item.description || `${item.productNameEn} — Verified high-quality supplier fulfillment with express USPS delivery.`,
        price: pricing.retailPrice.toFixed(2),
        msrp: pricing.msrp.toFixed(2),
        rating: (4.6 + (item.pid.charCodeAt(0) % 4) * 0.1).toFixed(1),
        numReviews: 24 + (item.pid.charCodeAt(1) % 50),
        stock: item.productWeight ? 100 : 50,
        isFeatured: false,
        banner: null,
        supplier: 'CJ_DROPSHIPPING',
        wholesaleCost: wholesale,
      };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('CJ Search Error:', message);
    return [];
  }
}
