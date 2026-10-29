import { calculateTieredPrice } from '../utils';

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

export interface PrintifyProductResult {
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

export async function getPrintifyShopId(apiKey: string): Promise<string | null> {
  const configuredShopId = process.env.PRINTIFY_SHOP_ID;
  if (configuredShopId) return configuredShopId;

  try {
    const res = await fetch(`${PRINTIFY_BASE_URL}/shops.json`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 }
    });
    const shops = await res.json();
    if (Array.isArray(shops) && shops.length > 0) {
      return String(shops[0].id);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Printify Shop Fetch Error:', message);
  }
  return null;
}

export async function getPrintifyProducts(limit = 12): Promise<PrintifyProductResult[]> {
  const apiKey = process.env.PRINTIFY_API;
  if (!apiKey) return [];

  try {
    const shopId = await getPrintifyShopId(apiKey);
    if (!shopId) return [];

    const res = await fetch(`${PRINTIFY_BASE_URL}/shops/${shopId}/products.json?limit=${limit}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 300 }
    });
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.map((item: any) => {
      const defaultVariant = item.variants?.[0] || {};
      const wholesale = (defaultVariant.cost || 1200) / 100;
      const pricing = calculateTieredPrice(wholesale);
      const slug = (item.title || 'apparel')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .substring(0, 50) + `-${(item.id || '').substring(0, 8)}`;

      const images = (item.images || []).map((img: any) => img.src).filter(Boolean);

      return {
        id: item.id,
        name: item.title,
        slug,
        category: 'Apparel & POD',
        images: images.length > 0 ? images : ['/images/sample-products/p1-1.jpg'],
        brand: 'Omnistu Originals',
        description: item.description?.replace(/<[^>]*>/g, '') || `${item.title} — Premium direct-to-garment print on ethically sourced fabric.`,
        price: pricing.retailPrice.toFixed(2),
        msrp: pricing.msrp.toFixed(2),
        rating: '4.9',
        numReviews: 38,
        stock: 100,
        isFeatured: true,
        banner: null,
        supplier: 'PRINTIFY',
        wholesaleCost: wholesale,
      };
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Printify Fetch Error:', message);
    return [];
  }
}
