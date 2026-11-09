import {prisma} from '@/db/prisma';
import {inspectBoundPaymentRecoveryTx,type BoundPaymentRecovery} from '@/lib/bound-payment-recovery';
import {orderDetailMetadata} from '@/lib/order-detail-metadata';
import { getOrderById } from '@/lib/actions/order.actions';
import { notFound, redirect } from 'next/navigation';
import OrderDetailsTable from './order-details-table';
import { ShippingAddress } from '@/types';
import { auth } from '@/auth';
import { stripeClientSecretForOrder } from '@/lib/stripe-intent';

export const generateMetadata = orderDetailMetadata;

const OrderDetailsPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const session = await auth();

  // Redirect the user if they don't own the order
  if (order.userId !== session?.user.id && session?.user.role !== 'admin') {
    return redirect('/unauthorized');
  }

  let paymentRecovery:BoundPaymentRecovery|undefined;
  if(order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')){try{paymentRecovery=await prisma.$transaction(tx=>inspectBoundPaymentRecoveryTx(tx,{orderId:order.id,userId:order.userId,now:new Date(),maxAgeMs:600000}))}catch{paymentRecovery='PAYMENT_REVIEW'}}
  const client_secret = !paymentRecovery||paymentRecovery==='READY'?await stripeClientSecretForOrder(order.id):null;

  return (
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      paymentRecovery={paymentRecovery}
      stripeClientSecret={client_secret}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
      cancellationOffered={!!order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')&&!order.paymentNote?.includes('SUPPLIER_ORDER_CANCELLED')&&!order.isPaid&&order.paymentResult===null}
      isAdmin={session?.user?.role === 'admin' || false}
    />
  );
};

export default OrderDetailsPage;
