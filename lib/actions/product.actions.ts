'use server';
import { prisma } from '@/db/prisma';
import { withVariantSummary } from '@/lib/product-variants';
import { convertToPlainObject, formatError, isDatabaseAvailable } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../auth-guard';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { Product } from '@/types';

import sampleData from '@/db/sample-data';
import { fixtureExclusion, hiddenSlugPrefixes, sampleCatalogAllowed } from '@/lib/test-fixture';
import { queryMatchesName } from '@/lib/search-match';
import { wordStartPattern } from '@/lib/search-sql';

// Get latest products
export async function getLatestProducts(): Promise<Product[]> {
  if (isDatabaseAvailable()) {
    try {
      const data = await prisma.product.findMany({
        where: fixtureExclusion(),
        take: LATEST_PRODUCTS_LIMIT,
        orderBy: { createdAt: 'desc' },
      });
      if (data && data.length > 0) {
        return convertToPlainObject(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Prisma getLatestProducts fallback:', msg);
    }
  }

  if (!sampleCatalogAllowed()) return [];
  return convertToPlainObject(
    sampleData.products.slice(0, LATEST_PRODUCTS_LIMIT).map((p, idx) => ({
      ...p,
      id: `sample-${idx + 1}`,
      price: p.price.toString(),
      rating: p.rating.toString(),
      createdAt: new Date(),
    }))
  );
}

// Get single product by it's slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isDatabaseAvailable()) {
    try {
      const item = await prisma.product.findFirst({
        where: { slug: slug, ...fixtureExclusion() },
      });
      if (item) return convertToPlainObject(item);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Prisma getProductBySlug fallback:', msg);
    }
  }

  if (!sampleCatalogAllowed()) return null;
  const sampleMatch = sampleData.products.find((p) => p.slug === slug);
  if (sampleMatch) {
    return convertToPlainObject({
      ...sampleMatch,
      id: `sample-${slug}`,
      price: sampleMatch.price.toString(),
      rating: sampleMatch.rating.toString(),
      createdAt: new Date(),
    }) as Product;
  }
  return null;
}

// Get single product by it's ID
export async function getProductById(productId: string): Promise<Product | null> {
  if (isDatabaseAvailable()) {
    try {
      const data = await prisma.product.findFirst({
        where: { id: productId },
      });
      if (data) return convertToPlainObject(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Prisma getProductById fallback:', msg);
    }
  }

  if (!sampleCatalogAllowed()) return null;
  const sampleMatch = sampleData.products.find(
    (p, idx) => `sample-${idx + 1}` === productId || `sample-${p.slug}` === productId
  );
  if (sampleMatch) {
    return convertToPlainObject({
      ...sampleMatch,
      id: productId,
      price: sampleMatch.price.toString(),
      rating: sampleMatch.rating.toString(),
      createdAt: new Date(),
    }) as Product;
  }
  return null;
}
// Get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  if (isDatabaseAvailable()) {
    try {
      // Database-level word-start matching (lib/search-sql.ts): filtering,
      // ordering, count and pagination all run in SQL, so they stay correct at
      // any catalog size. Every value is a bound parameter; the only raw text
      // is the whitelisted ORDER BY column and generated facet aliases.
      const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
      if (query && query !== 'all') {
        conditions.push(Prisma.sql`name ~* ${wordStartPattern(query)}`);
      }
      if (category && category !== 'all') {
        conditions.push(Prisma.sql`category = ${category}`);
      }
      if (price && price !== 'all') {
        const lo = Number(price.split('-')[0]);
        const hi = Number(price.split('-')[1]);
        conditions.push(Prisma.sql`price >= ${lo} AND price <= ${hi}`);
      }
      if (rating && rating !== 'all') {
        conditions.push(Prisma.sql`rating >= ${Number(rating)}`);
      }
      for (const p of hiddenSlugPrefixes()) {
        conditions.push(Prisma.sql`slug NOT LIKE ${p + '%'}`);
      }
      const whereSql = Prisma.join(conditions, ' AND ');
      const orderSql =
        sort === 'lowest'
          ? Prisma.sql`price ASC`
          : sort === 'highest'
          ? Prisma.sql`price DESC`
          : sort === 'rating'
          ? Prisma.sql`rating DESC`
          : Prisma.sql`"createdAt" DESC`;
      const offset = (page - 1) * limit;

      const idRows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Product" WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ${limit} OFFSET ${offset}`;
      const countRows = await prisma.$queryRaw<Array<{ c: bigint }>>`
        SELECT count(*) AS c FROM "Product" WHERE ${whereSql}`;
      const ids = idRows.map((r) => r.id);
      const rowsById = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: { variants: { select: { referenceCost: true } } },
      });
      const byId = new Map(rowsById.map((r) => [r.id, r]));
      const data = ids.map((id) => byId.get(id)).filter((r) => r !== undefined);
      const dataCount = Number(countRows[0]?.c ?? 0);

      return {
        data: convertToPlainObject(data.map(withVariantSummary)),
        totalPages: Math.ceil(dataCount / limit),
        totalCount: dataCount,
      };
    } catch (err: unknown) {
      console.warn('Prisma getAllProducts fallback:', err);
    }
  }

  if (!sampleCatalogAllowed()) {
    return { data: [], totalPages: 0, totalCount: 0 };
  }
  let filtered = [...sampleData.products];
  if (query && query !== 'all') {
    filtered = filtered.filter((p) => queryMatchesName(p.name, query));
  }
  if (category && category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (rating && rating !== 'all') {
    filtered = filtered.filter((p) => p.rating >= Number(rating));
  }
  if (price && price !== 'all') {
    const parts = price.split('-');
    const min = Number(parts[0]) || 0;
    const max = parts[1] ? Number(parts[1]) : Infinity;
    filtered = filtered.filter((p) => p.price >= min && p.price <= max);
  }

  if (sort === 'lowest') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'highest') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const totalPages = Math.ceil(filtered.length / limit);
  const data = filtered.slice((page - 1) * limit, page * limit).map((p, idx) => ({
    ...p,
    id: `sample-${idx + 1}`,
    price: p.price.toString(),
    rating: p.rating.toString(),
    createdAt: new Date(),
  }));

  return {
    data: convertToPlainObject(data),
    totalPages,
    totalCount: filtered.length,
  };
}

// Delete a product
export async function deleteProduct(id: string) {
  await requireAdmin();
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.delete({ where: { id } });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a product
export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  await requireAdmin();
  try {
    const product = insertProductSchema.parse(data);
    await prisma.product.create({ data: product });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product created successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  await requireAdmin();
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.update({
      where: { id: product.id },
      data: product,
    });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories
export async function getAllCategories() {
  if (isDatabaseAvailable()) {
    try {
      const data = await prisma.product.groupBy({
        by: ['category'],
        where: fixtureExclusion(),
        _count: true,
      });
      // Map to plain objects: raw groupBy rows carry the Prisma client's
      // computed-field getters, which crash when serialized to client
      // components (no price/rating on aggregate rows).
      if (data && data.length > 0) {
        return data.map((d) => ({ category: d.category, _count: d._count }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Prisma getAllCategories fallback:', msg);
    }
  }

  if (!sampleCatalogAllowed()) return [];
  const categoryCounts = new Map<string, number>();
  sampleData.products.forEach((p) => {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
  });

  return Array.from(categoryCounts.entries()).map(([category, count]) => ({
    category,
    _count: count,
  }));
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  if (isDatabaseAvailable()) {
    try {
      const data = await prisma.product.findMany({
        where: { isFeatured: true, ...fixtureExclusion() },
        orderBy: { createdAt: 'desc' },
        take: 4,
      });
      // Database mode: an empty result is an honest empty result. Never mix
      // in the bundled sample catalog.
      return convertToPlainObject(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Prisma getFeaturedProducts failed:', msg);
      return [];
    }
  }

  if (!sampleCatalogAllowed()) return [];
  return convertToPlainObject(
    sampleData.products.filter(p => p.isFeatured).slice(0, 4).map((p, idx) => ({
      ...p,
      id: `featured-${idx + 1}`,
      price: p.price.toString(),
      rating: p.rating.toString(),
      createdAt: new Date(),
    }))
  );
}



/**
 * How many products each price bucket / rating option would return, within the
 * current search text and category (the other facet selections are ignored, so
 * the numbers answer "what would I get if I picked this option"). Used so the
 * UI never offers an option that returns nothing.
 */
import { FACET_PRICE_BUCKETS, FACET_RATINGS, type FacetCounts } from '@/lib/constants/facets';

export async function getFacetCounts({ query, category }: { query?: string; category?: string }): Promise<FacetCounts> {
  const out: FacetCounts = { price: {}, rating: {} };
  if (isDatabaseAvailable()) {
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
      if (query && query !== 'all') {
        conditions.push(Prisma.sql`name ~* ${wordStartPattern(query)}`);
      }
      if (category && category !== 'all') {
        conditions.push(Prisma.sql`category = ${category}`);
      }
      for (const p of hiddenSlugPrefixes()) {
        conditions.push(Prisma.sql`slug NOT LIKE ${p + '%'}`);
      }
      const whereSql = Prisma.join(conditions, ' AND ');
      // One conditional-aggregation round trip: the same word-start matching
      // as getAllProducts, so facet counts agree with the results shown.
      const selectParts: Prisma.Sql[] = [];
      FACET_PRICE_BUCKETS.forEach((b, i) => {
        const [lo, hi] = b.split('-').map(Number);
        selectParts.push(Prisma.sql`count(*) FILTER (WHERE price >= ${lo} AND price <= ${hi}) AS ${Prisma.raw('b' + i)}`);
      });
      FACET_RATINGS.forEach((r, i) => {
        selectParts.push(Prisma.sql`count(*) FILTER (WHERE rating >= ${r}) AS ${Prisma.raw('r' + i)}`);
      });
      const aggRows = await prisma.$queryRaw<Array<Record<string, bigint | number>>>`
        SELECT ${Prisma.join(selectParts, ', ')} FROM "Product" WHERE ${whereSql}`;
      const agg = aggRows[0] ?? {};
      FACET_PRICE_BUCKETS.forEach((b, i) => {
        out.price[b] = Number(agg['b' + i] ?? 0);
      });
      FACET_RATINGS.forEach((r, i) => {
        out.rating[String(r)] = Number(agg['r' + i] ?? 0);
      });
      return out;
    } catch (err: unknown) {
      console.warn('Prisma getFacetCounts failed:', err instanceof Error ? err.message : String(err));
      return { price: {}, rating: {} };
    }
  }
  if (!sampleCatalogAllowed()) return out;
  let list = [...sampleData.products];
  if (query && query !== 'all') list = list.filter((p) => queryMatchesName(p.name, query));
  if (category && category !== 'all') list = list.filter((p) => p.category === category);
  for (const b of FACET_PRICE_BUCKETS) {
    const [lo, hi] = b.split('-').map(Number);
    out.price[b] = list.filter((p) => Number(p.price) >= lo && Number(p.price) <= hi).length;
  }
  for (const r of FACET_RATINGS) out.rating[String(r)] = list.filter((p) => Number(p.rating) >= r).length;
  return out;
}
