// Settles an order as paid. Deliberately NOT in a 'use server' file: server
// actions are callable from the network, and this must only run from trusted
// server code (payment capture, the Stripe webhook, admin COD confirmation).
import { prisma } from '@/db/prisma';
import { PaymentResult, ShippingAddress } from '@/types';
import { isAmountMismatch } from './payment-guards';
import { sendPurchaseReceipt } from '@/email';
import { sendOrderConfirmationEmail } from './mailer';
import { syncOrderToSupabase } from './providers/supabase-sync';
import { dispatchOrderFulfillment } from './fulfillment-dispatcher';
import { persistDispatchSummary } from './fulfillment-persistence';
import { revalidatePath } from 'next/cache';

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
