import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { isPaymentMethodAvailable } from '@/lib/payment-capabilities';
import { needsPaymentReview } from '@/lib/payment-review';
import { toMinorUnits, isExpectedCurrency } from '@/lib/payment-guards';

/** Server-only, called after owner/admin authorization. No replacement intent or automatic retry. */
export async function stripeClientSecretForOrder(orderId: string): Promise<string | null> {
  if (!isPaymentMethodAvailable('Stripe')) return null;
  const order = await prisma.order.findFirst({ where: { id: orderId } }).catch(() => null);
  if (!order || order.isPaid || order.paymentMethod !== 'Stripe' || needsPaymentReview(order.paymentNote)) return null;
  const amount = toMinorUnits(String(order.totalPrice));
  if (amount === null || amount <= 0) return null;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const stored = order.paymentResult as { id?: string; status?: string } | null;
  const safeSecret = (intent: Stripe.PaymentIntent) => {
    if (intent.metadata?.orderId !== order.id || intent.amount !== amount || !isExpectedCurrency(intent.currency)) return null;
    // Processing, succeeded and canceled are never presented as another payment opportunity.
    if (!['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(intent.status)) return null;
    return intent.client_secret;
  };
  if (stored?.id) {
    if (!/^pi_[A-Za-z0-9]+$/.test(stored.id) || stored.status !== 'INTENT_CREATED') return null;
    try { return safeSecret(await stripe.paymentIntents.retrieve(stored.id)); } catch { return null; }
  }
  const priorResult = order.paymentResult ?? Prisma.DbNull;
  const marker = [order.paymentNote, 'STRIPE_INTENT_REQUESTED - needs manual review if interrupted; no automatic retry'].filter(Boolean).join(' | ');
  const claim = await prisma.order.updateMany({
    where: { id: orderId, isPaid: false, paymentNote: order.paymentNote, paymentResult: { equals: priorResult } },
    data: { paymentNote: marker },
  }).catch(() => null);
  if (claim?.count !== 1) return null;
  try {
    const intent = await stripe.paymentIntents.create({ amount, currency: 'usd', metadata: { orderId: order.id } }, { idempotencyKey: `order-intent-${order.id}` });
    if (!/^pi_[A-Za-z0-9]+$/.test(intent.id) || !safeSecret(intent)) return null;
    const bound = await prisma.order.updateMany({
      where: { id: orderId, isPaid: false, paymentNote: marker, paymentResult: { equals: priorResult } },
      data: { paymentNote: order.paymentNote, paymentResult: { id: intent.id, status: 'INTENT_CREATED', email_address: '', pricePaid: '' } },
    });
    return bound.count === 1 ? safeSecret(intent) : null;
  } catch {
    // Marker remains if creation or persistence is uncertain. Never create a replacement on refresh.
    return null;
  }
}
