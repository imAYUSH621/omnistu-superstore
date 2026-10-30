import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

let cachedToken: string | null = null;
let tokenExpiry = 0;

interface CatalogRawItem {
  asin?: string;
  id?: string;
  title?: string;
  name?: string;
  price?: string | number;
  category?: string;
  image?: string;
  thumbnails?: string[];
  rating?: string | number;
  reviews?: string | number;
}

interface JITProduct {
  id: string;
  raw_id: string;
  vendor: string;
  sku: string;
  title: string;
  wholesale_cost: number;
  retail_price: number;
  msrp_price: number;
  savings_usd: number;
  gross_margin_usd: number;
  gross_margin_pct: number;
  category: string;
  images: string[];
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  shipping_estimate: string;
}

interface CJRawProduct {
  id?: string | number;
  pid?: string | number;
  sku?: string;
  nameEn?: string;
  productNameEn?: string;
  bigImage?: string;
  productImage?: string;
  sellPrice?: string | number;
  oneCategoryName?: string;
  categoryName?: string;
  listedNum?: number;
}

async function getCJToken(apiKey?: string): Promise<string | null> {
  if (!apiKey) return null;
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  try {
    const resp = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    const data = await resp.json();
    if (data.result && data.data?.accessToken) {
      cachedToken = data.data.accessToken;
      tokenExpiry = now + 14 * 86400 * 1000;
      return cachedToken;
    }
  } catch (err: unknown) {
    console.error('CJ Token Fetch Error:', err instanceof Error ? err.message : String(err));
  }
  return null;
}

/**
 * Intelligent tiered pricing:
 * Produces competitive retail prices that beat Amazon while maintaining healthy margins.
 */
function calculateCompetitivePricing(wholesaleCost: number) {
  let retail: number;
  let msrp: number;

  if (wholesaleCost <= 3.0) {
    retail = wholesaleCost * 2.2 + 3.99;
    retail = Math.min(Math.max(retail, 6.99), 11.99);
    msrp = retail * 1.55;
  } else if (wholesaleCost <= 8.0) {
    retail = wholesaleCost * 1.75 + 4.99;
    msrp = retail * 1.45;
  } else if (wholesaleCost <= 20.0) {
    retail = wholesaleCost * 1.5 + 5.99;
    msrp = retail * 1.35;
  } else if (wholesaleCost <= 50.0) {
    retail = wholesaleCost * 1.35 + 7.99;
    msrp = retail * 1.3;
  } else {
    retail = wholesaleCost * 1.25 + 9.99;
    msrp = retail * 1.25;
  }

  retail = Math.floor(retail) + 0.99;
  msrp = Math.floor(msrp) + 0.99;
  if (msrp <= retail) msrp = retail + 5.0;

  const grossSpread = Math.max(0, retail - wholesaleCost);
  const marginPct = Math.round((grossSpread / retail) * 100);

  return {
    retailPrice: parseFloat(retail.toFixed(2)),
    msrpPrice: parseFloat(msrp.toFixed(2)),
    wholesaleCost: parseFloat(wholesaleCost.toFixed(2)),
    grossMarginUsd: parseFloat(grossSpread.toFixed(2)),
    grossMarginPct: marginPct,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || searchParams.get('query') || 'trending').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(32, Math.max(8, parseInt(searchParams.get('limit') || '16') || 16));
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';

  const cjApiKey = process.env.FULFILLMENT_API_KEY || process.env.CJ_API_KEY;
  let results: JITProduct[] = [];
  let totalCount = 0;

  // 1. Check local unified catalog first (Zero Token / Zero Cost / <5ms)
  try {
    const catalogPath = path.join(process.cwd(), 'public', 'data', 'catalog_unified.json');
    if (fs.existsSync(catalogPath)) {
      const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const items = Object.values(rawCatalog) as CatalogRawItem[];

      const matched = items.filter((item) => {
        const matchesQuery =
          !query ||
          query === 'trending' ||
          (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
          (item.category && item.category.toLowerCase().includes(query.toLowerCase()));
        const matchesCategory =
          !category ||
          category === 'all' ||
          (item.category && item.category.toLowerCase() === category.toLowerCase());
        return matchesQuery && matchesCategory;
      });

      if (matched.length > 0) {
        results = matched.map((it) => {
          const rawPrice = parseFloat(String(it.price || '$19.99').replace(/[^0-9.]/g, '')) || 19.99;
          const wholesale = parseFloat((rawPrice * 0.45).toFixed(2));
          const pricing = calculateCompetitivePricing(wholesale);

          return {
            id: `OMN-${it.asin || it.id || Math.random().toString(36).substring(7)}`,
            raw_id: it.asin || it.id || 'N/A',
            vendor: 'OMNISTU_VERIFIED',
            sku: `OMN-SKU-${it.asin || it.id || 'N/A'}`,
            title: it.title || it.name || 'Curated Product',
            wholesale_cost: pricing.wholesaleCost,
            retail_price: rawPrice,
            msrp_price: pricing.msrpPrice,
            savings_usd: parseFloat((pricing.msrpPrice - rawPrice).toFixed(2)),
            gross_margin_usd: pricing.grossMarginUsd,
            gross_margin_pct: pricing.grossMarginPct,
            category: it.category || 'Curated Essentials',
            images: it.thumbnails && it.thumbnails.length ? it.thumbnails : [it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
            rating: parseFloat(String(it.rating || '4.8').split(' ')[0]) || 4.8,
            reviews_count: parseInt(String(it.reviews || '240').replace(/[^0-9]/g, '')) || 240,
            in_stock: true,
            shipping_estimate: '2-5 Business Days (Express Direct)',
          };
        });
        totalCount = results.length;
      }
    }
  } catch (err: unknown) {
    console.warn('Local catalog read error:', err instanceof Error ? err.message : String(err));
  }

  // 2. If results are few or external supplier search requested, query CJ Dropshipping v2.0
  if (results.length < limit && cjApiKey) {
    const token = await getCJToken(cjApiKey);
    if (token) {
      try {
        let searchUrl = `${CJ_BASE_URL}/product/listV2?keyWord=${encodeURIComponent(query)}&page=${page}&size=${limit}`;
        if (category && category !== 'all') {
          searchUrl += `&categoryId=${encodeURIComponent(category)}`;
        }

        const sResp = await fetch(searchUrl, {
          headers: {
            'CJ-Access-Token': token,
            'Content-Type': 'application/json',
          },
        });
        const sData = await sResp.json();

        let rawItems: CJRawProduct[] = [];
        if (sData.data?.content && Array.isArray(sData.data.content) && sData.data.content[0]?.productList) {
          rawItems = sData.data.content[0].productList as CJRawProduct[];
          totalCount = Math.max(totalCount, sData.data.content[0]?.total || rawItems.length);
        } else if (Array.isArray(sData.data?.list)) {
          rawItems = sData.data.list as CJRawProduct[];
          totalCount = Math.max(totalCount, sData.data?.total || rawItems.length);
        }

        const externalMapped: JITProduct[] = rawItems.map((it) => {
          const rawPriceStr = String(it.sellPrice || '1.0').split('--')[0].trim();
          const cost = parseFloat(rawPriceStr) || 1.0;
          const pricing = calculateCompetitivePricing(cost);
          const rawId = String(it.id || it.pid || it.sku);
          const internalId = `OMN-CJ-${rawId}`;
          const title = it.nameEn || it.productNameEn || `Trending Sourced (${it.sku})`;
          const img = it.bigImage || it.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

          return {
            id: internalId,
            raw_id: rawId,
            vendor: 'CJ_DROPSHIPPING',
            sku: it.sku || `SKU-${rawId}`,
            title: title,
            wholesale_cost: pricing.wholesaleCost,
            retail_price: pricing.retailPrice,
            msrp_price: pricing.msrpPrice,
            savings_usd: parseFloat((pricing.msrpPrice - pricing.retailPrice).toFixed(2)),
            gross_margin_usd: pricing.grossMarginUsd,
            gross_margin_pct: pricing.grossMarginPct,
            category: it.oneCategoryName || it.categoryName || 'Direct Electronics & Gadgets',
            images: [img],
            rating: 4.8,
            reviews_count: it.listedNum ? Math.min(it.listedNum, 500) : 128,
            in_stock: true,
            shipping_estimate: '4-7 Business Days (USPS Direct)',
          };
        });

        // Deduplicate and append
        const existingIds = new Set(results.map((r) => r.id));
        for (const item of externalMapped) {
          if (!existingIds.has(item.id)) {
            results.push(item);
            existingIds.add(item.id);
          }
        }
      } catch (err: unknown) {
        console.error('CJ Live JIT search exception:', err instanceof Error ? err.message : String(err));
      }
    }
  }

  // Sorting
  if (sort === 'lowest' || sort === 'price_asc') {
    results.sort((a, b) => a.retail_price - b.retail_price);
  } else if (sort === 'highest' || sort === 'price_desc') {
    results.sort((a, b) => b.retail_price - a.retail_price);
  } else if (sort === 'rating') {
    results.sort((a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count);
  }

  const paginated = results.slice((page - 1) * limit, page * limit);

  return NextResponse.json(
    {
      success: true,
      query,
      page,
      limit,
      total: totalCount || results.length,
      has_more: page * limit < (totalCount || results.length),
      products: paginated,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
