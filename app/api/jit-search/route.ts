import { NextResponse } from 'next/server';
import { searchAllSuppliers } from '@/lib/suppliers/router';
import { convertUsdToInr } from '@/lib/shipping';
import { priceFor } from '@/lib/pricing';
import {
  getUnifiedCatalog,
  parseCatalogPrice,
  parseCatalogRating,
  parseCatalogReviews,
  searchUnifiedCatalog,
  type UnifiedCatalogItem,
} from '@/lib/catalog-unified';

interface JITProduct {
  id: string;
  raw_id: string;
  vendor: string;
  sku: string;
  title: string;
  wholesale_cost: number;
  retail_price: number;
  retail_price_inr?: number;
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

/**
 * Intelligent tiered pricing:
 * Combines priceFor margin safety with retail discount anchoring.
 */
function calculateCompetitivePricing(wholesaleCost: number, shippingCost = 4.0) {
  const pricing = priceFor(wholesaleCost, shippingCost);
  let msrp = Math.floor(pricing.retailPrice * 1.35) + 0.99;
  if (msrp <= pricing.retailPrice) msrp = pricing.retailPrice + 5.0;

  return {
    retailPrice: pricing.retailPrice,
    msrpPrice: parseFloat(msrp.toFixed(2)),
    wholesaleCost: parseFloat(wholesaleCost.toFixed(2)),
    grossMarginUsd: pricing.profit,
    grossMarginPct: Math.round(pricing.marginPct),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || searchParams.get('query') || 'trending').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.min(32, Math.max(8, parseInt(searchParams.get('limit') || '16') || 16));
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const country = (searchParams.get('country') || 'US').trim().toUpperCase();

  let results: JITProduct[] = [];
  let totalCount = 0;

  // 1. Check local unified catalog first (cached in module scope - no
  // blocking file read per request; fixes D15).
  try {
    const matched = searchUnifiedCatalog(query, category);

    if (matched.length > 0) {
      results = matched
        .map((it: UnifiedCatalogItem): JITProduct | null => {
          const rawPrice = parseCatalogPrice(it.price);
          if (rawPrice === null) return null; // skip items with no usable price
          const wholesale = parseFloat((rawPrice * 0.45).toFixed(2));
          const pricing = calculateCompetitivePricing(wholesale);

          return {
            id: `OMN-${it.asin || it.id || 'N/A'}`,
            raw_id: it.asin || it.id || 'N/A',
            vendor: 'OMNISTU_VERIFIED',
            sku: `OMN-SKU-${it.asin || it.id || 'N/A'}`,
            title: it.title || it.name || 'Untitled product',
            wholesale_cost: pricing.wholesaleCost,
            retail_price: rawPrice,
            retail_price_inr: convertUsdToInr(rawPrice),
            msrp_price: pricing.msrpPrice,
            savings_usd: parseFloat((pricing.msrpPrice - rawPrice).toFixed(2)),
            gross_margin_usd: pricing.grossMarginUsd,
            gross_margin_pct: pricing.grossMarginPct,
            category: it.category || 'Uncategorized',
            images:
              it.thumbnails && it.thumbnails.length
                ? it.thumbnails
                : it.image
                  ? [it.image]
                  : [],
            // Source-catalog claims, not storefront-collected reviews.
            // 0 when the catalog has none - never an invented default.
            rating: parseCatalogRating(it.rating),
            reviews_count: parseCatalogReviews(it.reviews),
            in_stock: true,
            shipping_estimate:
              'Estimate only - supplier and carrier not yet confirmed for this item',
          };
        })
        .filter((r): r is JITProduct => r !== null);
      totalCount = results.length;
    }
  } catch (err: unknown) {
    console.warn('Local catalog read error:', err instanceof Error ? err.message : String(err));
  }

  // 2. If results are few or external supplier search requested, query suppliers router (CJ + Printify)
  if (results.length < limit) {
    try {
      const supplierRes = await searchAllSuppliers(query, { page, limit });
      if (supplierRes.products && supplierRes.products.length > 0) {
        const existingIds = new Set(results.map((r) => r.id));
        for (const sp of supplierRes.products) {
          const internalId = `OMN-${sp.supplier}-${sp.supplierProductId}`;
          if (existingIds.has(internalId)) continue;

          const pricing = calculateCompetitivePricing(sp.wholesaleCost);
          const retail = sp.retailPrice || pricing.retailPrice;

          results.push({
            id: internalId,
            raw_id: sp.supplierProductId,
            vendor: sp.supplier,
            sku: sp.sku || `SKU-${sp.supplierProductId}`,
            title: sp.title,
            wholesale_cost: sp.wholesaleCost,
            retail_price: retail,
            retail_price_inr: convertUsdToInr(retail),
            msrp_price: pricing.msrpPrice,
            savings_usd: parseFloat((pricing.msrpPrice - retail).toFixed(2)),
            gross_margin_usd: pricing.grossMarginUsd,
            gross_margin_pct: pricing.grossMarginPct,
            category: sp.supplier === 'PRINTIFY' ? 'Custom Apparel' : 'Direct Sourced',
            images: sp.images && sp.images.length ? sp.images : [],
            // No reviews exist for live supplier results - do not invent any.
            rating: 0,
            reviews_count: 0,
            in_stock: true,
            shipping_estimate:
              'Estimate only - confirmed with the supplier after order',
          });
          existingIds.add(internalId);
        }
      }
    } catch (err: unknown) {
      console.warn('Supplier router search failed:', err instanceof Error ? err.message : String(err));
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
