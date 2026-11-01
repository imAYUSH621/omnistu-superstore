'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { convertToPlainObject, formatError } from '../utils';
import { auth } from '@/auth';
import { getMyCart } from './cart.actions';
import { getUserById } from './user.actions';
import { insertOrderSchema } from '../validators';
import { prisma } from '@/db/prisma';
import { CartItem, PaymentResult, ShippingAddress } from '@/types';
import { paypal } from '../paypal';
import { isAmountMismatch, isExpectedCurrency, sameLineItems } from '../payment-guards';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import { sendPurchaseReceipt } from '@/email';
import { sendOrderConfirmationEmail } from '../mailer';
import { syncOrderToSupabase } from '../providers/supabase-sync';
import { dispatchOrderFulfillment } from '../fulfillment-dispatcher';
import { persistDispatchSummary } from '../fulfillment-persistence';

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
export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  });

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

// Update order to paid
export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  // Get order from database
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
    },
  });

  if (!order) throw new Error('Order not found');

  if (order.isPaid) throw new Error('Order is already paid');

  // D12: never mark paid when the captured amount disagrees with the
  // order total. The mismatch is recorded on the order and surfaced as an
  // error instead of silently accepting an under- or over-charge.
  if (paymentResult?.pricePaid != null && paymentResult.pricePaid !== '') {
    const expected = String(order.totalPrice);
    if (isAmountMismatch(paymentResult.pricePaid, expected)) {
      const note = `AMOUNT_MISMATCH: captured ${paymentResult.pricePaid}, expected ${expected}`;
      // updateMany + isPaid:false so a concurrent legitimate payment is never overwritten.
      await prisma.order.updateMany({
        where: { id: orderId, isPaid: false },
        data: {
          paymentNote: note,
          paymentResult: { ...paymentResult, status: 'AMOUNT_MISMATCH' },
        },
      });
      console.error(`[payments] ${note} on order ${orderId} - not marking paid`);
      throw new Error('Captured amount does not match the order total');
    }
  }

  // Transaction to claim the paid transition and account for product stock.
  // The claim is a compare-and-set on isPaid:false, taken FIRST inside the transaction: two
  // concurrent calls (webhook replay, double-click, webhook racing the PayPal capture) serialize
  // on the row lock and only one sees count 1. If the stock update then fails, the whole
  // transaction, claim included, rolls back and the order stays unpaid and retryable.
  await prisma.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      where: { id: orderId, isPaid: false },
      data: { isPaid: true, paidAt: new Date(), paymentResult },
    });
    if (claim.count !== 1) throw new Error('Order is already paid');

    for (const item of order.orderitems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: -item.qty } },
      });
    }
  });

  // Get updated order after transaction
  const updatedOrder = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderitems: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!updatedOrder) throw new Error('Order not found');

  if (updatedOrder.user?.email) {
    sendOrderConfirmationEmail({
      customerName: updatedOrder.user.name || 'Valued Customer',
      customerEmail: updatedOrder.user.email,
      orderId: updatedOrder.id,
      orderDate: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      items: updatedOrder.orderitems.map((oi) => ({
        name: oi.name,
        quantity: oi.qty,
        price: String(oi.price),
      })),
      subtotal: String(updatedOrder.itemsPrice),
      shipping: String(updatedOrder.shippingPrice),
      total: String(updatedOrder.totalPrice),
    }).catch((e) => console.error('Order confirmation email error:', e));
  }

  sendPurchaseReceipt({
    order: {
      ...updatedOrder,
      shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
      paymentResult: updatedOrder.paymentResult as PaymentResult,
    },
  });

  // Mirror paid order into Supabase cloud persistence layer asynchronously
  syncOrderToSupabase({
    order_id: updatedOrder.id,
    customer_name: updatedOrder.user?.name || 'Customer',
    customer_email: updatedOrder.user?.email || 'customer@omnistu.com',
    shipping_address: (updatedOrder.shippingAddress || {}) as Record<string, unknown>,
    total_usd: Number(updatedOrder.totalPrice),
    status: 'PAID',
  }).catch((e) => console.error('Supabase sync background error:', e));

  // Auto-dispatch order items to CJ Dropshipping and Printify supplier fulfillment pipelines
  dispatchOrderFulfillment({
    id: updatedOrder.id,
    orderitems: updatedOrder.orderitems.map((oi) => ({
      name: oi.name,
      slug: oi.slug,
      qty: oi.qty,
      price: String(oi.price),
      productId: oi.productId,
    })),
    shippingAddress: (updatedOrder.shippingAddress || {}) as Record<string, unknown>,
    user: updatedOrder.user ? { name: updatedOrder.user.name, email: updatedOrder.user.email } : undefined,
    totalPrice: String(updatedOrder.totalPrice),
  })
    .then((summary) => persistDispatchSummary(updatedOrder.id, summary))
    .catch((e) => console.error('Supplier auto-fulfillment background error:', e));
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
  try {
    const ordersCount = await prisma.order.count();
    const productsCount = await prisma.product.count();
    const usersCount = await prisma.user.count();

    const totalSales = await prisma.order.aggregate({
      _sum: { totalPrice: true },
    });

    // D8: an empty database reports real zeros, never invented numbers.
    let salesData: SalesDataType = [];
    try {
      const salesDataRaw = await prisma.$queryRaw<
        Array<{ month: string; totalSales: Prisma.Decimal }>
      >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`;

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
