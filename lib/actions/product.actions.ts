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
import { fixtureExclusion } from '@/lib/test-fixture';

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
      const queryFilter: Prisma.ProductWhereInput =
        query && query !== 'all'
          ? {
              name: {
                contains: query,
                mode: 'insensitive',
              } as Prisma.StringFilter,
            }
          : {};

      const categoryFilter = category && category !== 'all' ? { category } : {};

      const priceFilter: Prisma.ProductWhereInput =
        price && price !== 'all'
          ? {
              price: {
                gte: Number(price.split('-')[0]),
                lte: Number(price.split('-')[1]),
              },
            }
          : {};

      const ratingFilter =
        rating && rating !== 'all'
          ? {
              rating: {
                gte: Number(rating),
              },
            }
          : {};

      const where: Prisma.ProductWhereInput = {
        ...fixtureExclusion(),
        ...queryFilter,
        ...categoryFilter,
        ...priceFilter,
        ...ratingFilter,
      };
      const data = await prisma.product.findMany({
        where,
        orderBy:
          sort === 'lowest'
            ? { price: 'asc' }
            : sort === 'highest'
            ? { price: 'desc' }
            : sort === 'rating'
            ? { rating: 'desc' }
            : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { variants: { select: { referenceCost: true } } },
      });

      // Count the FILTERED set (it used to count every product, so filtered
      // searches showed wrong page counts).
      const dataCount = await prisma.product.count({ where });

      return {
        data: convertToPlainObject(data.map(withVariantSummary)),
        totalPages: Math.ceil(dataCount / limit),
        totalCount: dataCount,
      };
    } catch (err: unknown) {
      console.warn('Prisma getAllProducts fallback:', err);
    }
  }

  let filtered = [...sampleData.products];
  if (query && query !== 'all') {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
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
      const base: Prisma.ProductWhereInput = {
        ...fixtureExclusion(),
        ...(query && query !== 'all' ? { name: { contains: query, mode: 'insensitive' } as Prisma.StringFilter } : {}),
        ...(category && category !== 'all' ? { category } : {}),
      };
      for (const b of FACET_PRICE_BUCKETS) {
        const [lo, hi] = b.split('-').map(Number);
        out.price[b] = await prisma.product.count({ where: { ...base, price: { gte: lo, lte: hi } } });
      }
      for (const r of FACET_RATINGS) {
        out.rating[String(r)] = await prisma.product.count({ where: { ...base, rating: { gte: r } } });
      }
      return out;
    } catch (err: unknown) {
      console.warn('Prisma getFacetCounts failed:', err instanceof Error ? err.message : String(err));
      return { price: {}, rating: {} };
    }
  }
  let list = [...sampleData.products];
  if (query && query !== 'all') list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  if (category && category !== 'all') list = list.filter((p) => p.category === category);
  for (const b of FACET_PRICE_BUCKETS) {
    const [lo, hi] = b.split('-').map(Number);
    out.price[b] = list.filter((p) => Number(p.price) >= lo && Number(p.price) <= hi).length;
  }
  for (const r of FACET_RATINGS) out.rating[String(r)] = list.filter((p) => Number(p.rating) >= r).length;
  return out;
}
