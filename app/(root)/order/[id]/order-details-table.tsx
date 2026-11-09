'use client';
import SupplierPaymentReview from '@/components/shared/order/supplier-payment-review';
import type {SupplierPaymentObservation} from '@/lib/supplier-payment-reconciliation';
import SupplierFundingReview,{type SupplierFundingView} from '@/components/shared/order/supplier-funding-review';
import type{BoundPaymentRecovery}from'@/lib/bound-payment-recovery';
import{BOUND_CHECKOUT_COPY}from'@/lib/bound-checkout-language';
import{BOUND_RECOVERY_COPY}from'@/lib/bound-payment-recovery-copy';

import {CHECKOUT_COPY} from '@/lib/checkout-language';
import CancelUnpaidOrder,{CancelledUnpaidOrderNotice} from '@/components/shared/order/cancel-unpaid-order';
import { Badge } from '@/components/ui/badge';
import { shippingBadgeState } from '@/lib/tracking';
import { Card, CardContent } from '@/components/ui/card';
import ReturnRequestButton from '@/components/shared/order/return-request-button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, } from '@/lib/utils';
import { Order } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useState,useTransition } from 'react';
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import {
  createPayPalOrder,
  approvePayPalOrder,
  updateOrderToPaidCOD,
  updateOrderToPaidTest,
  deliverOrderTest,
  deliverOrder,
} from '@/lib/actions/order.actions';
import StripePayment from './stripe-payment';
import OrderTrackingStepper from '@/components/shared/order/order-tracking-stepper';
import T from '@/components/shared/i18n-text';
import { isSimulatedOrder } from '@/lib/order-simulation';
import { useStoreLanguage } from '@/hooks/use-store-language';
import { ORDER_DETAIL_COPY } from '@/lib/order-detail-language';
import { orderHistoryDate } from '@/lib/order-history-language';

const OrderDetailsTable = ({
  order,
  paypalClientId,
  isAdmin,
  stripeClientSecret,
  cancellationOffered=false,
  paymentRecovery,
  supplierPaymentEnabled=false,
  supplierPaymentInitial=null,
  supplierFundingEnabled=false,
  supplierFundingInitial=null,
}: {
  order: Omit<Order, 'paymentResult'>;
  paypalClientId: string;
  isAdmin: boolean;
  stripeClientSecret: string | null;
  cancellationOffered?:boolean;
  paymentRecovery?:BoundPaymentRecovery;
  supplierPaymentEnabled?:boolean;
  supplierPaymentInitial?:SupplierPaymentObservation|null;
  supplierFundingEnabled?:boolean;
  supplierFundingInitial?:SupplierFundingView;
}) => {
  const {
    id,
    shippingAddress,
    orderitems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentMethod,
    isDelivered,
    isPaid,
    paidAt,
    deliveredAt,
    dispatchStatus,
    trackingNumber,
    trackingCarrier,
    dispatchedAt,
  } = order;

  const language=useStoreLanguage();
  const copy=ORDER_DETAIL_COPY[language];
  const date=(value:Date|string)=>orderHistoryDate(value,language)+' UTC';
  const[cancelAttempted,setCancelAttempted]=useState(false);
  const[cancelledLocally,setCancelledLocally]=useState(false);
  const cancelled=cancelledLocally||order.paymentNote?.includes('SUPPLIER_ORDER_CANCELLED')===true;
  const simulated = isSimulatedOrder(order);
  const qualifiedTest = Boolean(order.paymentNote?.startsWith('QUALIFIED TEST ONLY'));
  const { toast } = useToast();

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    let status = '';

    if (isPending) {
      status = copy.paypalLoading;
    } else if (isRejected) {
      status = copy.paypalError;
    }
    return status;
  };

  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(order.id);

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
    }

    return res.data;
  };

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(order.id, data);

    toast({
      variant: res.success ? 'default' : 'destructive',
      description: res.message,
    });
  };

  // Button to mark order as paid
  const MarkAsPaidButton = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderToPaidCOD(order.id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
      >
        {isPending ? copy.processing : copy.markPaid}
      </Button>
    );
  };

  // Simulated buttons for TEST_CHECKOUT_MODE TestPayment orders. The server
  // actions re-check the mode, ownership and payment method, so rendering
  // them is not the authorization boundary.
  const SimulatePaidButton = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderToPaidTest(order.id);
            toast({ variant: res.success ? 'default' : 'destructive', description: res.message });
          })
        }
      >
        {isPending ? copy.processing : copy.simulatePaid}
      </Button>
    );
  };

  const SimulateDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await deliverOrderTest(order.id);
            toast({ variant: res.success ? 'default' : 'destructive', description: res.message });
          })
        }
      >
        {isPending ? copy.processing : copy.simulateDelivered}
      </Button>
    );
  };

  // Button to verify provider/carrier delivery, never set it manually
  const MarkAsDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await deliverOrder(order.id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
      >
        {isPending ? copy.processing : copy.markDelivered}
      </Button>
    );
  };

  return (
    <div className='space-y-6'>
      {/* 4-Step Amazon Carrier Tracking Stepper */}
      {(paymentRecovery==='PAYMENT_REVIEW'||paymentRecovery==='OFFER_REVIEW')&&<p role='alert' className='rounded-md border border-amber-300 p-4 text-sm'>{BOUND_RECOVERY_COPY[language][paymentRecovery==='PAYMENT_REVIEW'?'payment':'offer']}</p>}
      {cancelled?<CancelledUnpaidOrderNotice/>:<OrderTrackingStepper
        orderId={id}
        simulated={simulated}
        isPaid={isPaid}
        isDelivered={isDelivered}
        dispatchStatus={dispatchStatus}
        trackingNumber={trackingNumber}
        trackingCarrier={trackingCarrier}
        dispatchedAt={dispatchedAt}
      />}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5'>
        <div className='md:col-span-2 min-w-0 space-y-4 overflow-x-auto'>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4 font-bold'><T k='paymentMethod' /></h2>
              <p className='mb-2 font-medium'>{paymentMethod}</p>
              {isPaid ? (
                <>
                  <Badge variant='secondary' className='bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
                    {simulated?copy.testPaid:copy.paidAt} {date(paidAt!)}
                  </Badge>
                  <div className='mt-4'>
                    {simulated?<p className='text-sm text-muted-foreground'>{copy.testNote}</p>:<ReturnRequestButton orderId={id} />}
                  </div>
                </>
              ) : (
                <Badge variant='destructive'>{paymentRecovery==='PAYMENT_REVIEW'?BOUND_RECOVERY_COPY[language].badge:simulated ? copy.testUnpaid : <T k='notPaid' />}</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4 font-bold'><T k='shippingAddress' /></h2>
              <p className='font-semibold'>{shippingAddress.fullName}</p>
              <p className='mb-2 text-muted-foreground'>
                {shippingAddress.streetAddress}, {shippingAddress.city},{' '}
                {shippingAddress.state?shippingAddress.state+', ':''}{shippingAddress.postalCode}, {shippingAddress.country}
              </p>
              {shippingAddress.phone&&<p className='mb-2 text-sm'>{CHECKOUT_COPY[language].phone}: {shippingAddress.phone}</p>}
              {simulated ? (<Badge variant='outline'>{isDelivered ? copy.testDelivered : copy.testShipping}</Badge>) : shippingBadgeState({ isDelivered, dispatchStatus, trackingNumber }) === 'delivered' ? (
                <Badge variant='secondary' className='bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
                  {copy.deliveredAt} {date(deliveredAt!)}
                </Badge>
              ) : shippingBadgeState({ isDelivered, dispatchStatus, trackingNumber }) === 'in_transit' ? (
                <Badge variant='outline' className='text-amber-600 border-amber-400'>
                  {copy.transit}{trackingCarrier ? ` ${copy.via} ${trackingCarrier}` : ''}
                </Badge>
              ) : (
                <Badge variant='outline' className='text-muted-foreground'>
                  {copy.notDispatched}
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4 font-bold'><T k='orderItems' /></h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><T k='itemLabel' /></TableHead>
                    <TableHead><T k='quantityLabel' /></TableHead>
                    <TableHead className='text-right'><T k='priceLabel' /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderitems.map((item) => (
                    <TableRow key={item.lineKey||`${item.slug}:${item.name}`}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className='flex flex-col items-start sm:flex-row sm:items-center gap-2 sm:gap-3 hover:text-primary transition'
                        >
                          <div className='relative w-12 h-12 rounded overflow-hidden bg-neutral-100 flex-shrink-0'>
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes='48px'
                              className='object-contain p-1'
                            />
                          </div>
                          <span className='font-medium whitespace-normal break-words'>{item.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className='px-2 font-bold'>{item.qty}</span>
                      </TableCell>
                      <TableCell className='text-right font-bold'>
                        ${item.price}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className='p-5 space-y-4'>
              <h2 className='text-lg font-bold pb-2 border-b'>{copy.summary}</h2>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'><T k='itemsLabel' /></span>
                <span>{formatCurrency(itemsPrice)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {simulated
                    ? copy.testTax
                    : order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')?BOUND_CHECKOUT_COPY[language].tax:copy.tax}
                </span>
                <span>{formatCurrency(taxPrice)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {simulated
                    ? copy.testShippingRate
                    : <T k='shippingLabel' />}
                </span>
                <span className='text-emerald-600 font-semibold'>
                  {Number(shippingPrice) === 0 ? copy.free : formatCurrency(shippingPrice)}
                </span>
              </div>
              <div className='flex flex-wrap justify-between gap-x-3 gap-y-1 text-base font-extrabold pt-2 border-t'>
                <span><T k='totalLabel' /> (USD)</span>
                <span className='text-emerald-600'>{formatCurrency(totalPrice)} USD</span>
              </div>

              {!cancelled&&paymentRecovery!=='PAYMENT_REVIEW'&&cancellationOffered&&<CancelUnpaidOrder orderId={id} onAttempt={()=>setCancelAttempted(true)} onCancelled={()=>setCancelledLocally(true)}/>}
              {/* PayPal Payment */}
              {(!paymentRecovery||paymentRecovery==='READY') && !cancelAttempted && !cancelled && !simulated && !isPaid && paymentMethod === 'PayPal' && (
                <div className='pt-2'>
                  <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                    <PrintLoadingState />
                    <PayPalButtons
                      createOrder={handleCreatePayPalOrder}
                      onApprove={handleApprovePayPalOrder}
                    />
                  </PayPalScriptProvider>
                </div>
              )}

              {/* Stripe Payment */}
              {(!paymentRecovery||paymentRecovery==='READY') && !cancelAttempted && !cancelled && !simulated && !isPaid && paymentMethod === 'Stripe' && stripeClientSecret && (
                <div className='pt-2'>
                  <StripePayment
                    priceInCents={Number(order.totalPrice) * 100}
                    orderId={order.id}
                    clientSecret={stripeClientSecret}
                  />
                </div>
              )}

              {/* Cash On Delivery */}
              {isAdmin && (!paymentRecovery||paymentRecovery==='READY') && !cancelAttempted && !cancelled && !simulated && !isPaid && paymentMethod === 'CashOnDelivery' && (
                <MarkAsPaidButton />
              )}
              {isAdmin && isPaid && !isDelivered && !simulated && <MarkAsDeliveredButton />}
              {isAdmin && isPaid && !simulated && order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION') && <SupplierPaymentReview orderId={id} enabled={supplierPaymentEnabled} initial={supplierPaymentInitial}/>}
              {isAdmin && isPaid && !simulated && order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION') && <SupplierFundingReview orderId={id} enabled={supplierFundingEnabled} initial={supplierFundingInitial}/>}

              {/* Simulated test checkout */}
              {simulated && (
                <div className='rounded-md border border-sky-300 bg-sky-50 px-3 py-2.5 text-xs text-sky-900 mb-2' data-testid='test-order-banner'>
                  {copy.testBanner}
                </div>
              )}
              {!isPaid && paymentMethod === 'TestPayment' && <SimulatePaidButton />}
              {isPaid && !isDelivered && paymentMethod === 'TestPayment' && !qualifiedTest && <SimulateDeliveredButton />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsTable;
