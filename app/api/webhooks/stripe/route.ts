import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/db/prisma';
import { needsPaymentReview } from '@/lib/payment-review';
import { recordCapturedUnsettled } from '@/lib/captured-unsettled';
import { updateOrderToPaid } from '@/lib/order-settlement';
import { isExpectedCurrency, stripeMinorToAmount } from '@/lib/payment-guards';

export async function POST(req: NextRequest) {
  // Build the webhook event
  let event: Stripe.Event;
  try {
    event = await Stripe.webhooks.constructEvent(
      await req.text(),
      req.headers.get('stripe-signature') as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    return NextResponse.json({ message: 'Invalid webhook signature' }, { status: 400 });
  }

  // Check for successful payment
  if (event.type === 'charge.succeeded') {
    const { object } = event.data;

    // A charge without our order metadata is not ours to act on. An undefined
    // id would make Prisma's findFirst match an arbitrary order.
    const orderId = object.metadata?.orderId;
    if (typeof orderId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
      return NextResponse.json({ message: 'charge has no orderId metadata; ignored' });
    }
    // Persist intake before attempting settlement. A lost response/crash must not silently retry
    // settlement or lose the signed charge. DB failure before intake returns503 with no mutation.
    const row = await prisma.order.findFirst({ where: { id: orderId }, select: { id: true, isPaid: true, paymentNote: true } }).catch(() => null);
    if (!row) return NextResponse.json({ message: 'Payment event could not be recorded' }, { status: 503 });
    if (row.isPaid) return NextResponse.json({ message: 'Payment event already recorded' });
    if (needsPaymentReview(row.paymentNote)) return NextResponse.json({ message: 'Payment event received; order needs manual review' });
    const marker = [row.paymentNote, `STRIPE_SETTLEMENT_REQUESTED capture=${object.id} - confirmed charge; needs review if interrupted; no automatic retry`].filter(Boolean).join(' | ');
    try {
      const claimed = await prisma.order.updateMany({ where: { id: orderId, isPaid: false, paymentNote: row.paymentNote }, data: { paymentNote: marker } });
      if (claimed.count !== 1) return NextResponse.json({ message: 'Payment event could not be recorded' }, { status: 503 });
    } catch {
      return NextResponse.json({ message: 'Payment event could not be recorded' }, { status: 503 });
    }
    if (!isExpectedCurrency(object.currency)) {
      await recordCapturedUnsettled(orderId, object.id, stripeMinorToAmount(object.amount), null, 'CAPTURED_UNSETTLED', 'CURRENCY_MISMATCH');
      return NextResponse.json({ message: 'Payment event received; currency needs manual review' });
    }
    try {
      // Only settle a verified event; neither an incident nor a replay triggers another charge.
      await updateOrderToPaid({
        orderId,
        paymentResult: {
          id: object.id,
          status: 'COMPLETED',
          email_address: object.billing_details?.email ?? '',
          pricePaid: stripeMinorToAmount(object.amount),
        },
      });
    } catch (error) {
      const code = (error as { settlementCode?: unknown } | null)?.settlementCode;
      if (code === 'ALREADY_PAID') {
        const paid = await prisma.order.findFirst({ where: { id: orderId, isPaid: true }, select: { id: true } }).catch(() => null);
        if (paid) return NextResponse.json({ message: 'Payment event already recorded' });
      }
      await recordCapturedUnsettled(orderId, object.id, stripeMinorToAmount(object.amount), error);
      // Acknowledge the known charge, not successful settlement. Manual review, never a capture,
      // refund or automatic settlement retry. Marker persistence remains best effort if DB is down.
      return NextResponse.json({ message: 'Payment event received; order needs manual review' });
    }

    return NextResponse.json({
      message: 'updateOrderToPaid was successful',
    });
  }

  return NextResponse.json({
    message: 'event is not charge.succeeded',
  });
}
