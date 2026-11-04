'use server';

import { cookies } from 'next/headers';
import { isTestFixtureSlug, TEST_FIXTURE_MESSAGE, isTestCatalogSlug, TEST_CATALOG_MESSAGE } from '@/lib/test-fixture';
import { testCheckoutMode } from '@/lib/payment-capabilities';
import { CartItem } from '@/types';
import { convertToPlainObject, formatError, round2, isDatabaseAvailable } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { cartItemSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
type CartTx = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(0.15 * itemsPrice),
    totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

async function addItemLocked(data: CartItem, db: CartTx) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await readMyCart(db);

    // Parse and validate item
    let item = cartItemSchema.parse(data);
    if (!Number.isSafeInteger(item.qty) || item.qty <= 0) throw new Error('Invalid quantity');

    // Find product in database
    const product = await db.product.findFirst({
      where: { id: item.productId },
      include: { _count: { select: { variants: true } } },
    });
    if (!product) throw new Error('Product not found');
    const supplied = data as CartItem & { variantId?: unknown; variantSku?: unknown; sku?: unknown };
    if (supplied.variantId != null || supplied.variantSku != null || supplied.sku != null || ((product._count?.variants ?? 0) > 0 && !testCheckoutMode())) {
      throw new Error('Variant checkout is not available for this product yet.');
    }
    if (isTestFixtureSlug(product.slug)) throw new Error(TEST_FIXTURE_MESSAGE);
    if (isTestCatalogSlug(product.slug) && !testCheckoutMode()) throw new Error(TEST_CATALOG_MESSAGE);

    item = { ...item, name: product.name, slug: product.slug, image: product.images[0] || '/images/placeholder.svg', price: String(product.price) };
    if (product.stock < item.qty) throw new Error('Not enough stock');

    if (!cart) {
      // Create new cart object
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...calcPrice([item]),
      });

      // Add to database
      await db.cart.create({
        data: newCart,
      });

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      // Check if item is already in cart
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId
      );

      if (existItem) {
        // Check stock
        if (product.stock < existItem.qty + item.qty) {
          throw new Error('Not enough stock');
        }

        // Increase the quantity
        (cart.items as CartItem[]).find(
          (x) => x.productId === item.productId
        )!.qty = existItem.qty + item.qty;
        Object.assign(existItem, { name: item.name, slug: item.slug, image: item.image, price: item.price });
      } else {
        // If item does not exist in cart
        // Check stock
        if (product.stock < 1) throw new Error('Not enough stock');

        // Add item to the cart.items
        cart.items.push(item);
      }

      // Save to database
      await db.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${
          existItem ? 'updated in' : 'added to'
        } cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

async function readMyCart(db: Pick<typeof prisma, 'cart'> = prisma) {
  if (!isDatabaseAvailable()) {
    return undefined;
  }

  // Check for cart cookie
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) return undefined;

  // Get session and user ID
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Get user cart from database
  const cart = await db.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId, userId: null },
  });

  if (!cart) return undefined;

  // Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

export async function getMyCart() { return readMyCart(); }

async function removeItemLocked(productId: string, db: CartTx) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get Product
    const product = await db.product.findFirst({
      where: { id: productId },
    });
    if (!product) throw new Error('Product not found');

    // Get user cart
    const cart = await readMyCart(db);
    if (!cart) throw new Error('Cart not found');

    // Check for item
    const exist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId
    );
    if (!exist) throw new Error('Item not found');

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from cart
      cart.items = (cart.items as CartItem[]).filter(
        (x) => x.productId !== exist.productId
      );
    } else {
      // Decrease qty
      (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty =
        exist.qty - 1;
    }

    // Update cart in database
    await db.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calcPrice(cart.items as CartItem[]),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} was removed from cart`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

async function withCartLock<T>(operation: (tx: CartTx) => Promise<T>) {
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) throw new Error('Cart session not found');
  const session = await auth();
  const identity = session?.user?.id ? `user:${session.user.id}` : `guest:${sessionCartId}`;
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${identity}))`;
    return operation(tx);
  }, { maxWait: 15000, timeout: 15000 });
}
export async function addItemToCart(data: CartItem) {
  try { return await withCartLock(tx => addItemLocked(data, tx)); }
  catch (error) { return { success: false, message: formatError(error) }; }
}
export async function removeItemFromCart(productId: string) {
  try { return await withCartLock(tx => removeItemLocked(productId, tx)); }
  catch (error) { return { success: false, message: formatError(error) }; }
}
