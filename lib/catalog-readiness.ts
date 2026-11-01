import { planCatalogImport, type ImportRow } from '@/lib/catalog-import';

type Unified = { asin?: string; title?: string; price?: string | number; image?: string; thumbnails?: string[]; category?: string };

export type Readiness = {
  total: number;
  /** fields that can be derived from the file without inventing anything */
  derived: string[];
  /** Product fields the file cannot supply; never fabricated */
  missing: string[];
  importable: number;
  invalid: number;
  sampleInvalidReason: string | null;
};

/**
 * Maps what catalog_unified.json genuinely contains onto the Product shape.
 * Brand, description and stock are NOT in the file and are never made up, so
 * rows stay invalid (not importable) until a real source supplies them.
 * Ratings and review counts are not mapped: they are unverified claims.
 */
export function mapUnifiedToProductRow(u: Unified): ImportRow {
  const price = typeof u.price === 'string' ? u.price.replace(/[^0-9.]/g, '') : u.price;
  const images = [u.image, ...(u.thumbnails ?? [])].filter((x): x is string => !!x);
  return {
    name: u.title,
    slug: u.asin ? u.asin.toLowerCase() : undefined,
    category: u.category,
    price,
    images: Array.from(new Set(images)),
  };
}

export function assessUnifiedCatalog(items: Unified[]): Readiness {
  const rows = items.map(mapUnifiedToProductRow);
  const plan = planCatalogImport(rows, new Set(), false);
  return {
    total: items.length,
    derived: ['name (title)', 'slug (id, lowercased)', 'category', 'price', 'images'],
    missing: ['brand', 'description', 'stock'],
    importable: plan.create.length,
    invalid: plan.invalid.length,
    sampleInvalidReason: plan.invalid[0]?.error ?? null,
  };
}
