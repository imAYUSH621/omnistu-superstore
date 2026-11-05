import {containsRetailIdentity}from './retail-line-boundary';
import { insertProductSchema } from '@/lib/validators';

export type ImportRow = Record<string, unknown>;
export type ImportPlan = {
  create: ImportRow[];
  update: ImportRow[];
  skipExisting: string[];
  invalid: { index: number; slug: string; error: string }[];
};

/** Fields an --update-existing run may touch. Never stock, price, rating or isFeatured (live business data). */
export const UPDATABLE_FIELDS = ['name', 'description', 'images', 'brand', 'category', 'banner'] as const;

/**
 * Pure planner: decides what an import would do, writes nothing.
 * Existing slugs are left alone unless updateExisting is set, and even then
 * only descriptive fields change. Nothing is ever deleted.
 */
export function planCatalogImport(rows: ImportRow[], existingSlugs: Set<string>, updateExisting: boolean): ImportPlan {
  const plan: ImportPlan = { create: [], update: [], skipExisting: [], invalid: [] };
  const seen = new Set<string>();
  rows.forEach((raw, index) => {
    const slug = typeof raw?.slug === 'string' ? raw.slug : '';
    // Product-only schema strips unknown keys. Never silently flatten a supplier option
    // or variant-priced offer into a base-product listing at an unrelated price/stock.
    if (containsRetailIdentity(raw)) {
      plan.invalid.push({index,slug,error:'Variant-bearing rows require a qualified retail variant import path'});
      return;
    }
    const parsed = insertProductSchema.safeParse({ isFeatured: false, banner: null, ...raw, price: normalisePrice(raw?.price) });
    if (!parsed.success) {
      plan.invalid.push({ index, slug, error: parsed.error.issues[0]?.message ?? 'invalid row' });
      return;
    }
    if (parsed.data.stock < 0 || !Number.isInteger(parsed.data.stock)) {
      plan.invalid.push({ index, slug, error: 'stock must be a non-negative integer' });
      return;
    }
    if (seen.has(parsed.data.slug)) {
      plan.invalid.push({ index, slug, error: 'duplicate slug in file' });
      return;
    }
    seen.add(parsed.data.slug);
    if (!existingSlugs.has(parsed.data.slug)) plan.create.push(parsed.data);
    else if (updateExisting) plan.update.push(parsed.data);
    else plan.skipExisting.push(parsed.data.slug);
  });
  return plan;
}

function normalisePrice(p: unknown): unknown {
  if (typeof p === 'number' && Number.isFinite(p)) return p.toFixed(2);
  return p;
}

/** Destructive seeding is only for local databases unless explicitly overridden. */
export function seedAllowed(databaseUrl: string | undefined, env: { NODE_ENV?: string; ALLOW_DESTRUCTIVE_SEED?: string }): { ok: boolean; reason?: string } {
  if (env.ALLOW_DESTRUCTIVE_SEED === '1') return { ok: true };
  if (env.NODE_ENV === 'production') return { ok: false, reason: 'NODE_ENV is production' };
  if (!databaseUrl) return { ok: false, reason: 'DATABASE_URL is not set' };
  let host = '';
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    return { ok: false, reason: 'DATABASE_URL is not a valid URL' };
  }
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) return { ok: false, reason: 'database host is not local' };
  return { ok: true };
}
