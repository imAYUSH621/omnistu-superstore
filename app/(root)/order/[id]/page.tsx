import type {SupplierPaymentObservation} from '@/lib/supplier-payment-reconciliation';
import type {SupplierFundingView} from '@/components/shared/order/supplier-funding-review';
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

  let supplierFundingInitial:SupplierFundingView=null;
  if(session?.user?.role==='admin'&&order.isPaid&&order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')){
    try{const records=await prisma.$queryRaw<NonNullable<SupplierFundingView>[]>`SELECT state,quote FROM "SupplierFundingPreparation" WHERE "orderId"=${order.id}::uuid`;supplierFundingInitial=records[0]??((order.isDelivered||order.dispatchStatus==='DISPATCHED')?{state:'SUPPLIER_PROGRESSED',quote:null}:null);}
    catch{supplierFundingInitial={state:'UNAVAILABLE',quote:null};}
  }
  let supplierCreationState:string|null=null;
  if(session?.user?.role==='admin'&&order.isPaid&&order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')){
    try{const rows=await prisma.$queryRaw<{state:string}[]>`SELECT state FROM "OrderSupplierAttempt" WHERE "orderId"=${order.id}::uuid`;supplierCreationState=rows[0]?.state??null;}catch{supplierCreationState='UNAVAILABLE';}
  }
  let supplierPaymentInitial:SupplierPaymentObservation|null=null;
  if(session?.user?.role==='admin'&&order.isPaid&&order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')){
    try{const rows=await prisma.$queryRaw<{evidence:SupplierPaymentObservation}[]>`SELECT evidence FROM "SupplierPaymentObservation" WHERE "orderId"=${order.id}::uuid ORDER BY "observedAt" DESC LIMIT 1`;supplierPaymentInitial=rows[0]?.evidence??null;}catch{/* Optional read-review schema may not be released yet; never infer payment. */}
  }
  return (
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      paymentRecovery={paymentRecovery}
      supplierCreationState={supplierCreationState}
      supplierCreationEnabled={process.env.CJ_CREATION_RECOVERY_ENABLED==='true'}
      supplierPaymentInitial={supplierPaymentInitial}
      supplierPaymentEnabled={process.env.CJ_PAYMENT_RECONCILIATION_ENABLED==='true'}
      supplierFundingInitial={supplierFundingInitial}
      supplierFundingEnabled={process.env.CJ_FUNDING_PREPARATION_ENABLED==='true'}
      stripeClientSecret={client_secret}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
      cancellationOffered={!!order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')&&!order.paymentNote?.includes('SUPPLIER_ORDER_CANCELLED')&&!order.isPaid&&order.paymentResult===null}
      isAdmin={session?.user?.role === 'admin' || false}
    />
  );
};

export default OrderDetailsPage;
