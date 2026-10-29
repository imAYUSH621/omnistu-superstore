'use server';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { Product } from '@/types';

import sampleData from '@/db/sample-data';

// Get latest products
export async function getLatestProducts(): Promise<Product[]> {
  try {
    const data = await prisma.product.findMany({
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
  try {
    const item = await prisma.product.findFirst({
      where: { slug: slug },
    });
    if (item) return convertToPlainObject(item);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Prisma getProductBySlug fallback:', msg);
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
  try {
    const data = await prisma.product.findFirst({
      where: { id: productId },
    });
    if (data) return convertToPlainObject(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Prisma getProductById fallback:', msg);
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
  // Query filter
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  // Category filter
  const categoryFilter = category && category !== 'all' ? { category } : {};

  // Price filter
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== 'all'
      ? {
          price: {
            gte: Number(price.split('-')[0]),
            lte: Number(price.split('-')[1]),
          },
        }
      : {};

  // Rating filter
  const ratingFilter =
    rating && rating !== 'all'
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  const data = await prisma.product.findMany({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    },
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
  });

  const dataCount = await prisma.product.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a product
export async function deleteProduct(id: string) {
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
  const data = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
  });

  return data;
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const data = await prisma.product.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
    if (data && data.length > 0) {
      return convertToPlainObject(data);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Prisma getFeaturedProducts fallback:', msg);
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
