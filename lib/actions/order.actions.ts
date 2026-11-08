'use server';
import {qualifiedRetailTestEnabled} from '@/lib/retail/gate';
import {qualifiedOrderItems,payQualifiedTestOrder} from '@/lib/retail/store';
import { assertCheckoutSnapshot } from '@/lib/cart-checkout-snapshot';
import { cartLinesMatchCatalog, cartTotalsConsistent } from '@/lib/cart-line-integrity';

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
import { firstUnavailableLine, isExpectedCurrency, sameLineItems } from '../payment-guards';
import { revalidatePath } from 'next/cache';
import { PAGE_SIZE } from '../constants';
import { Prisma } from '@prisma/client';
import { updateOrderToPaid, updateOrderToPaidSimulated } from '../order-settlement';
import { requireAdmin } from '../auth-guard';
import { recordCapturedUnsettled } from '../captured-unsettled';
import { needsPaymentReview, PAYMENT_REVIEW_MESSAGE } from '../payment-review';

// Create order and create the order items
export async function createOrder(idempotencyKey?: string) {
  if(qualifiedRetailTestEnabled())return{success:false,message:'Review the qualified cart before placing this test order.',redirectTo:'/cart'};
  let authenticatedUserId: string | undefined;
  try {
    const session = await auth();
    if (!session) throw new Error('User is not authenticated');

    const cart = await getMyCart();
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not found');
    authenticatedUserId = userId;

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

    {
      const cartLines = cart.items as { productId: string; qty: number; name?: string }[];
      const rows = await prisma.product.findMany({
        where: { id: { in: cartLines.map((l) => l.productId) } },
        select: { id: true, stock: true, price: true, slug: true, _count: { select: { variants: true } } },
      });
      if (!testCheckoutMode() && rows.some(p => (p._count?.variants ?? 0) > 0)) return { success: false, message: 'Variant checkout is not available for this product yet.', redirectTo: '/cart' };
      if (!cartLinesMatchCatalog(cart.items as CartItem[], rows) || !cartTotalsConsistent(cart)) return { success: false, message: 'Product details changed. Please update your cart before placing the order.', redirectTo: '/cart' };
      const short = firstUnavailableLine(cartLines, new Map(rows.map((r) => [r.id, r.stock])));
      if (short) {
        return {
          success: false,
          message: `Not enough stock for "${short}". Please update your cart.`,
          redirectTo: '/cart',
        };
      }
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
        where: { idempotencyKey, userId: authenticatedUserId },
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
      // Share the cart edit lock and refuse stale snapshots rather than clearing new edits.
      await assertCheckoutSnapshot(tx, user.id, cart);
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
        where: { idempotencyKey, userId: authenticatedUserId },
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

  if(data.paymentNote?.startsWith('QUALIFIED TEST ONLY'))data.orderitems=await qualifiedOrderItems(data.id);
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
  let creationAttempted = false;
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
      if (order.paymentMethod !== 'PayPal' || !isPaymentMethodAvailable('PayPal')) throw new Error('PayPal is not available for this order');
      if (needsPaymentReview(order.paymentNote)) throw new Error(PAYMENT_REVIEW_MESSAGE);
      const stored = order.paymentResult as PaymentResult | null;
      if (stored?.paypalEnv && stored.paypalEnv !== paypal.environment) throw new Error(PAYMENT_REVIEW_MESSAGE);
      {
        const lines = await prisma.orderItem.findMany({
          where: { orderId },
          select: { productId: true, qty: true, name: true },
        });
        const rows = await prisma.product.findMany({
          where: { id: { in: lines.map((l) => l.productId) } },
          select: { id: true, stock: true },
        });
        const short = firstUnavailableLine(lines, new Map(rows.map((r) => [r.id, r.stock])));
        if (short) throw new Error(`Not enough stock for "${short}"`);
      }
      // Reuse the original, unattempted provider order rather than replace its binding.
      if (stored?.id) {
        if (stored.status) throw new Error(PAYMENT_REVIEW_MESSAGE);
        return { success: true, message: 'Payment order already created', data: stored.id };
      }
      // Claim before contacting PayPal. A crash leaves a durable, non-expiring review marker.
      const priorResult = order.paymentResult ?? Prisma.DbNull;
      const priorNote = order.paymentNote;
      const marker = [priorNote, 'PAYPAL_CREATE_REQUESTED - needs manual review if interrupted; no automatic retry'].filter(Boolean).join(' | ');
      const claim = await prisma.order.updateMany({
        where: { id: orderId, isPaid: false, paymentNote: priorNote, paymentResult: { equals: priorResult } },
        data: { paymentNote: marker },
      });
      if (claim.count !== 1) throw new Error(PAYMENT_REVIEW_MESSAGE);
      creationAttempted = true;
      const paypalOrder = await paypal.createOrder(Number(order.totalPrice));
      if (typeof paypalOrder?.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(paypalOrder.id)) throw new Error(PAYMENT_REVIEW_MESSAGE);
      const bound = await prisma.order.updateMany({
        where: { id: orderId, isPaid: false, paymentNote: marker, paymentResult: { equals: priorResult } },
        data: {
          paymentNote: priorNote,
          paymentResult: { id: paypalOrder.id, paypalEnv: paypal.environment, email_address: '', status: '', pricePaid: '' },
        },
      });
      if (bound.count !== 1) throw new Error(PAYMENT_REVIEW_MESSAGE);

      return {
        success: true,
        message: 'Item order created successfully',
        data: paypalOrder.id,
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    return { success: false, message: creationAttempted ? PAYMENT_REVIEW_MESSAGE : formatError(error) };
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

    if (order.isPaid) throw new Error('Order is already paid');
    if (order.paymentMethod !== 'PayPal' || !isPaymentMethodAvailable('PayPal')) throw new Error('PayPal is not available for this order');
    const stored = order.paymentResult as PaymentResult | null;
    if (typeof data?.orderID !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(data.orderID) || !stored?.id || data.orderID !== stored.id) {
      throw new Error('Payment order does not match this order');
    }
    if (needsPaymentReview(order.paymentNote) || stored.status) throw new Error(PAYMENT_REVIEW_MESSAGE);
    if (stored.paypalEnv && stored.paypalEnv !== paypal.environment) throw new Error(PAYMENT_REVIEW_MESSAGE);
    // One winner across processes, before any capture request. The marker survives timeouts/crashes.
    // It is never automatically expired, cleared, or retried, even if the provider call was not sent.
    const marker = [order.paymentNote, `CAPTURE_REQUESTED capture=${stored.id} - outcome not confirmed; needs manual review, no automatic retry`].filter(Boolean).join(' | ');
    const claim = await prisma.order.updateMany({
      where: { id: orderId, isPaid: false, paymentNote: order.paymentNote, paymentResult: { equals: order.paymentResult ?? Prisma.DbNull } },
      data: { paymentNote: marker },
    });
    if (claim.count !== 1) throw new Error(PAYMENT_REVIEW_MESSAGE);

    let captureData;
    try {
      captureData = await paypal.capturePayment(data.orderID);
    } catch (captureError) {
      const outcome = (captureError as { outcome?: string } | null)?.outcome;
      if (outcome === 'UNKNOWN') {
        // Money may have been captured: leave a durable review marker and never tell the buyer it failed.
        await recordCapturedUnsettled(
          orderId,
          String(data.orderID),
          undefined,
          captureError,
          'CAPTURE_UNCONFIRMED',
          String((captureError as { detail?: string }).detail ?? 'UNKNOWN')
        );
        throw new Error('We could not confirm the payment status yet. Please do not pay again until it has been checked.');
      }
      if (outcome === 'REJECTED') throw new Error('PayPal did not complete the payment.');
      // Pre-capture auth failures and untyped provider errors must not leak external response text.
      // The durable attempt marker remains for review, even if capture was never sent.
      throw new Error(PAYMENT_REVIEW_MESSAGE);
    }

    // Distinguish the capture states from the actual PayPal response; money may have moved in several of
    // them, so only a definite DECLINED/FAILED (or an order that never completed) is reported as not paid.
    const unconfirmed = async (kind: 'CAPTURE_PENDING' | 'CAPTURE_UNCONFIRMED', reason: string, message: string, amount?: string) => {
      await recordCapturedUnsettled(orderId, String(captureData?.id ?? data.orderID), amount, null, kind, reason);
      throw new Error(message);
    };
    const NOT_CONFIRMED = 'We could not confirm the payment status yet. Please do not pay again until it has been checked.';
    if (!captureData) await unconfirmed('CAPTURE_UNCONFIRMED', 'NO_RESPONSE_DATA', NOT_CONFIRMED);
    const rawCapture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const capStatus: string | undefined = rawCapture?.status;
    if (captureData.id !== (order.paymentResult as PaymentResult)?.id) {
      await unconfirmed('CAPTURE_UNCONFIRMED', 'ORDER_ID_MISMATCH', NOT_CONFIRMED);
    }
    if (capStatus === 'PENDING') {
      const why = String(rawCapture?.status_details?.reason ?? 'PENDING').toUpperCase();
      await unconfirmed(
        'CAPTURE_PENDING',
        why,
        'Your payment is pending with PayPal and has not been confirmed yet. Please do not pay again.',
        rawCapture?.amount?.value
      );
    }
    if (capStatus === 'DECLINED' || capStatus === 'FAILED') throw new Error('PayPal did not complete the payment.');
    if (captureData.status !== 'COMPLETED' && !rawCapture) {
      await unconfirmed('CAPTURE_UNCONFIRMED', 'INCOMPLETE_CAPTURE_DATA', NOT_CONFIRMED);
    }
    const capture = rawCapture;
    if (!capture) await unconfirmed('CAPTURE_UNCONFIRMED', 'NO_CAPTURE_DATA', NOT_CONFIRMED);
    if (capture!.status !== 'COMPLETED') {
      await unconfirmed('CAPTURE_UNCONFIRMED', 'UNEXPECTED_CAPTURE_STATE', NOT_CONFIRMED, capture!.amount?.value);
    }
    // Fail closed: without an amount the amount check in updateOrderToPaid would be skipped (it only
    // compares when pricePaid is present).
    if (captureData.status !== 'COMPLETED' || capture!.amount?.value == null || capture!.amount.value === '') {
      await unconfirmed('CAPTURE_UNCONFIRMED', 'INCOMPLETE_CAPTURE_DATA', NOT_CONFIRMED);
    }
    if (!isExpectedCurrency(capture?.amount?.currency_code)) {
      await recordCapturedUnsettled(orderId, captureData.id, capture?.amount?.value, null, 'CAPTURED_UNSETTLED', 'CURRENCY_MISMATCH');
      throw new Error('The payment currency could not be matched to this order. Please do not pay again until it has been checked.');
    }

    // Update order to paid. The PayPal capture above is external and cannot roll back with a
    // DB transaction: if settlement fails now, money is captured but the order is unpaid. Leave a
    // durable, searchable record (never a refund, never a retry) so it can be reconciled.
    try {
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: captureData.id,
          paypalEnv: (order.paymentResult as PaymentResult)?.paypalEnv,
          status: captureData.status,
          email_address: captureData.payer?.email_address ?? '',
          pricePaid:
            captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
        },
      });
    } catch (settleError) {
      await recordCapturedUnsettled(orderId, captureData.id, capture.amount?.value, settleError);
      // Allowlist by typed code, never by message text. "Already paid" passes through only when the
      // database really shows the order paid; amount mismatch is a typed, already-recorded case.
      const code = (settleError as { settlementCode?: string } | null)?.settlementCode;
      if (code === 'AMOUNT_MISMATCH') throw settleError;
      if (code === 'ALREADY_PAID') {
        const paid = await prisma.order.findFirst({ where: { id: orderId, isPaid: true }, select: { id: true } }).catch(() => null);
        if (paid) throw settleError;
      }
      throw new Error('Your payment was received but the order could not be finalized yet. Please do not pay again.');
    }

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
    if (order.paymentNote?.startsWith('QUALIFIED TEST ONLY')) throw new Error('No shipment exists for qualified test checkout');
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
      select: { paymentMethod: true, userId: true, paymentNote:true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      throw new Error('User is not authorized');
    }
    if (order.paymentMethod !== 'TestPayment') {
      throw new Error('Only simulated test orders can be paid this way');
    }

    if(order.paymentNote?.startsWith('QUALIFIED TEST ONLY'))await payQualifiedTestOrder(order.userId,orderId);
    else await updateOrderToPaidSimulated(orderId);
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
      select: { paymentMethod: true, userId: true, isPaid: true,paymentNote:true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      throw new Error('User is not authorized');
    }
    if(order.paymentNote?.startsWith('QUALIFIED TEST ONLY'))throw Error('No shipment exists for qualified test checkout');
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
