import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { isExpectedCurrency, stripeMinorToAmount } from '@/lib/payment-guards';

export async function POST(req: NextRequest) {
  // Build the webhook event
  const event = await Stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature') as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  // Check for successful payment
  if (event.type === 'charge.succeeded') {
    const { object } = event.data;

    // A charge without our order metadata is not ours to act on. An undefined
    // id would make Prisma's findFirst match an arbitrary order.
    const orderId = object.metadata?.orderId;
    if (typeof orderId !== 'string' || orderId.length === 0) {
      return NextResponse.json({ message: 'charge has no orderId metadata; ignored' });
    }
    if (!isExpectedCurrency(object.currency)) {
      console.error(`[payments] Stripe charge ${object.id} currency ${object.currency} is not USD - not marking order ${orderId} paid`);
      return NextResponse.json({ message: 'unexpected currency; order not updated' }, { status: 400 });
    }

    // Update order status
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: object.id,
        status: 'COMPLETED',
        email_address: object.billing_details.email!,
        pricePaid: stripeMinorToAmount(object.amount),
      },
    });

    return NextResponse.json({
      message: 'updateOrderToPaid was successful',
    });
  }

  return NextResponse.json({
    message: 'event is not charge.succeeded',
  });
}
