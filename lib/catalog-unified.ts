import fs from 'fs';
import path from 'path';

export interface UnifiedCatalogItem {
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

/**
 * Loads public/data/catalog_unified.json ONCE per server process.
 * The jit-search route previously re-read and re-parsed the file on every
 * request (D15). This module caches the parsed catalog in module scope.
 */
let cache: UnifiedCatalogItem[] | null = null;

export function getUnifiedCatalog(): UnifiedCatalogItem[] {
  if (cache) return cache;
  try {
    const catalogPath = path.join(process.cwd(), 'public', 'data', 'catalog_unified.json');
    if (!fs.existsSync(catalogPath)) {
      cache = [];
      return cache;
    }
    const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    cache = Object.values(raw) as UnifiedCatalogItem[];
    return cache;
  } catch (err: unknown) {
    console.warn('Unified catalog load failed:', err instanceof Error ? err.message : String(err));
    cache = [];
    return cache;
  }
}

/** Parse a "$24.99" style price; returns null when absent or unparsable. */
export function parseCatalogPrice(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Parse "4.9 out of 5 stars" / 4.9 into a number. Returns 0 when absent -
 * never a fabricated default. Note these are source-catalog claims, not
 * reviews collected on this storefront.
 */
export function parseCatalogRating(raw: string | number | undefined): number {
  if (raw === undefined || raw === null) return 0;
  const n = parseFloat(String(raw).split(' ')[0]);
  return Number.isFinite(n) ? n : 0;
}

/** Parse "1,480" into a number. Returns 0 when absent. */
export function parseCatalogReviews(raw: string | number | undefined): number {
  if (raw === undefined || raw === null) return 0;
  const n = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function searchUnifiedCatalog(query: string, category: string): UnifiedCatalogItem[] {
  const q = (query || '').trim().toLowerCase();
  const cat = (category || '').trim().toLowerCase();
  return getUnifiedCatalog().filter((item) => {
    const matchesQuery =
      !q ||
      q === 'trending' ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q));
    const matchesCategory =
      !cat || cat === 'all' || (item.category && item.category.toLowerCase() === cat);
    return matchesQuery && matchesCategory;
  });
}
