'use server';

import { isPaymentMethodAvailable, testCheckoutMode } from '@/lib/payment-capabilities';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { isTestFixtureSlug, TEST_FIXTURE_MESSAGE, isTestCatalogSlug, TEST_CATALOG_MESSAGE } from '@/lib/test-fixture';
import { convertToPlainObject, formatError } from '../utils';
import { auth } from '@/auth';
import { getMyCart } from './cart.actions';
import { getUserById } from './user.actions';
import { insertOrderSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem, PaymentResult } from '@/types';
import { paypal } from '../paypal';
import { isExpectedCurrency, sameLineItems } from '../payment-guards';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import { updateOrderToPaid, updateOrderToPaidSimulated } from '../order-settlement';
import { requireAdmin } from '../auth-guard';

// Create order and create the order items
export async function createOrder(idempotencyKey?: string) {
  try {
    const session = await auth();
    if (!session) throw new Error('User is not authenticated');

    const cart = await getMyCart();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not found');

    const user = await getUserById(userId);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: 'Your cart is empty',
        redirectTo: '/cart',
      };
    }

    if ((cart.items as { slug?: string }[]).some((i) => isTestFixtureSlug(i.slug))) {
      return { success: false, message: TEST_FIXTURE_MESSAGE, redirectTo: '/cart' };
    }

    if (!testCheckoutMode() && (cart.items as { slug?: string }[]).some((i) => isTestCatalogSlug(i.slug))) {
      return { success: false, message: TEST_CATALOG_MESSAGE, redirectTo: '/cart' };
    }

    if (!user.address) {
      return {
        success: false,
        message: 'No shipping address',
        redirectTo: '/shipping-address',
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: 'No payment method',
        redirectTo: '/payment-method',
      };
    }

    if (!isPaymentMethodAvailable(user.paymentMethod)) {
      return {
        success: false,
        message: 'That payment method is not available yet. Please choose another.',
        redirectTo: '/payment-method',
      };
    }

    // D11 duplicate-submit guard: a client-supplied idempotency key makes
    // retries return the original order instead of charging twice.
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          success: true,
          message: 'Order already created',
          redirectTo: `/order/${existing.id}`,
        };
      }
    } else {
      // Fallback when no key is supplied: block an identical order (same
      // user, same total, same items) created in the last 30 seconds.
      const since = new Date(Date.now() - 30_000);
      const recent = await prisma.order.findFirst({
        where: {
          userId: user.id,
          totalPrice: cart.totalPrice,
          createdAt: { gte: since },
        },
        include: { orderitems: true },
        orderBy: { createdAt: 'desc' },
      });
      if (recent) {
        const sameItems = sameLineItems(
          recent.orderitems,
          cart.items as CartItem[]
        );
        if (sameItems) {
          return {
            success: true,
            message: 'Order already created',
            redirectTo: `/order/${recent.id}`,
          };
        }
      }
    }

    // Create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    const orderData = idempotencyKey
      ? { ...order, idempotencyKey }
      : order;

    // Create a transaction to create order and order items in database
    const insertedOrderId = await prisma.$transaction(async (tx) => {
      // Create order
      const insertedOrder = await tx.order.create({ data: orderData });
      // Create order items from the cart items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: item.price,
            orderId: insertedOrder.id,
          },
        });
      }
      // Clear cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error('Order not created');

    // The cart was just emptied: refresh the layout so the header badge resets.
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Order created',
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // Lost the idempotency race: another request created it first.
    if (
      idempotencyKey &&
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2002'
    ) {
      const existing = await prisma.order.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          success: true,
          message: 'Order already created',
          redirectTo: `/order/${existing.id}`,
        };
      }
    }
    return { success: false, message: formatError(error) };
  }
}

// Get order by id
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// This is a server action, so anyone can call it directly. It returns an order only to its
// owner or an admin. Everyone else, and any id that is not a UUID, gets null (the page shows 404).
export async function getOrderById(orderId: string) {
  if (typeof orderId !== 'string' || !UUID_RE.test(orderId)) return null;
  const session = await auth();
  if (!session?.user?.id) return null;
  const data = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!data) return null;
  if (data.userId !== session.user.id && session.user.role !== 'admin') return null;

  return convertToPlainObject(data);
}

// Server actions are callable outside the page that checks ownership, so the
// owner-or-admin rule is enforced here too.
async function requireOrderAccess(orderUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('User is not authenticated');
  if (session.user.id !== orderUserId && session.user.role !== 'admin') {
    throw new Error('User is not authorized');
  }
}

// Create new paypal order
export async function createPayPalOrder(orderId: string) {
  try {
    // Get order from database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (order) {
      await requireOrderAccess(order.userId);
      if (order.isPaid) throw new Error('Order is already paid');
      // Create paypal order
      const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

      // Update order with paypal order id
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentResult: {
            id: paypalOrder.id,
            email_address: '',
            status: '',
            pricePaid: 0,
          },
        },
      });

      return {
        success: true,
        message: 'Item order created successfully',
        data: paypalOrder.id,
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Approve paypal order and update order to paid
export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  try {
    // Get order from database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error('Order not found');
    await requireOrderAccess(order.userId);

    const captureData = await paypal.capturePayment(data.orderID);

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Error in PayPal payment');
    }

    const capture = captureData.purchase_units[0]?.payments?.captures[0];
    // Fail closed: without a COMPLETED capture carrying an amount, the amount check in
    // updateOrderToPaid would be skipped (it only compares when pricePaid is present).
    if (
      !capture ||
      capture.status !== 'COMPLETED' ||
      capture.amount?.value == null ||
      capture.amount.value === ''
    ) {
      throw new Error('PayPal capture is missing, incomplete or has no amount');
    }
    if (!isExpectedCurrency(capture?.amount?.currency_code)) {
      const note = `CURRENCY_MISMATCH: captured ${capture?.amount?.currency_code ?? 'unknown'}, expected USD`;
      await prisma.order.update({ where: { id: orderId }, data: { paymentNote: note } });
      console.error(`[payments] ${note} on order ${orderId} - not marking paid`);
      throw new Error('Captured currency does not match the order currency');
    }

    // Update order to paid
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid:
          captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Your order has been paid',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


// Get user's orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('User is not authorized');

  const data = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: { userId: session?.user?.id },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

// Get sales data and order summary
export async function getOrderSummary() {
  await requireAdmin();
  try {
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();

    // Only orders marked paid count as revenue (before any refunds).
    const totalSales = await prisma.order.aggregate({
      where: { isPaid: true },
      _sum: { totalPrice: true },
    });

    // D8: an empty database reports real zeros, never invented numbers.
    let salesData: SalesDataType = [];
    try {
      const salesDataRaw = await prisma.$queryRaw<
        Array<{ month: string; totalSales: Prisma.Decimal }>
      >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" WHERE "isPaid" = true GROUP BY to_char("createdAt", 'MM/YY')`;

      salesData = salesDataRaw.map((entry) => ({
        month: entry.month,
        totalSales: Number(entry.totalSales),
      }));
    } catch {
      salesData = [];
    }

    const latestSales = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
      take: 6,
    });

    return {
      ordersCount,
      productsCount,
      usersCount,
      totalSales,
      salesData,
      latestSales,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('[admin] getOrderSummary failed:', formatError(error));
    return {
      unavailable: true as const,
      ordersCount: 0,
      productsCount: 0,
      usersCount: 0,
      totalSales: { _sum: { totalPrice: null } },
      salesData: [],
      latestSales: [],
    };
  }
}

// Get all orders
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  await requireAdmin();
  const queryFilter: Prisma.OrderWhereInput =
    query && query !== 'all'
      ? {
          user: {
            name: {
              contains: query,
              mode: 'insensitive',
            } as Prisma.StringFilter,
          },
        }
      : {};

  const data = await prisma.order.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: { user: { select: { name: true } } },
  });

  const dataCount = await prisma.order.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete an order
export async function deleteOrder(id: string) {
  await requireAdmin();
  try {
    await prisma.order.delete({ where: { id } });

    revalidatePath('/admin/orders');

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update COD order to paid
export async function updateOrderToPaidCOD(orderId: string) {
  try {
    // Server actions are callable outside the UI: the admin-only button is not
    // an authorization check. Require an admin session and a COD order.
    const session = await auth();
    if (session?.user?.role !== 'admin') throw new Error('User is not authorized');

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      select: { paymentMethod: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.paymentMethod !== 'CashOnDelivery') {
      throw new Error('Only Cash on Delivery orders can be marked paid manually');
    }

    await updateOrderToPaid({ orderId });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: 'Order marked as paid' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update COD order to delivered
export async function deliverOrder(orderId: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') throw new Error('User is not authorized');

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error('Order not found');
    if (!order.isPaid) throw new Error('Order is not paid');

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: 'Order has been marked delivered',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Simulated payment for a TestPayment order (test checkout mode only). The
// order owner (or an admin) can mark their own test order paid; everything
// downstream is a labeled simulation - no real charge, no supplier order.
export async function updateOrderToPaidTest(orderId: string) {
  try {
    if (!testCheckoutMode()) throw new Error('Test checkout is not enabled');
    const session = await auth();
    if (!session?.user?.id) throw new Error('User is not authenticated');

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      select: { paymentMethod: true, userId: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      throw new Error('User is not authorized');
    }
    if (order.paymentMethod !== 'TestPayment') {
      throw new Error('Only simulated test orders can be paid this way');
    }

    await updateOrderToPaidSimulated(orderId);
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: 'Test order marked as paid (simulated - no real charge)' };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}

// Simulated delivery for a paid TestPayment order (test checkout mode only).
export async function deliverOrderTest(orderId: string) {
  try {
    if (!testCheckoutMode()) throw new Error('Test checkout is not enabled');
    const session = await auth();
    if (!session?.user?.id) throw new Error('User is not authenticated');

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      select: { paymentMethod: true, userId: true, isPaid: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      throw new Error('User is not authorized');
    }
    if (order.paymentMethod !== 'TestPayment') {
      throw new Error('Only simulated test orders can be delivered this way');
    }
    if (!order.isPaid) throw new Error('Order is not paid');

    await prisma.order.update({
      where: { id: orderId },
      data: { isDelivered: true, deliveredAt: new Date() },
    });
    revalidatePath(`/order/${orderId}`);
    return { success: true, message: 'Test order marked as delivered (simulated - no real shipment)' };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}
