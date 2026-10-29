'use client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Order } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import {
  createPayPalOrder,
  approvePayPalOrder,
  updateOrderToPaidCOD,
  deliverOrder,
} from '@/lib/actions/order.actions';
import StripePayment from './stripe-payment';
import OrderTrackingStepper from '@/components/shared/order/order-tracking-stepper';

const OrderDetailsTable = ({
  order,
  paypalClientId,
  isAdmin,
  stripeClientSecret,
}: {
  order: Omit<Order, 'paymentResult'>;
  paypalClientId: string;
  isAdmin: boolean;
  stripeClientSecret: string | null;
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
  } = order;

  const { toast } = useToast();

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    let status = '';

    if (isPending) {
      status = 'Loading PayPal...';
    } else if (isRejected) {
      status = 'Error Loading PayPal';
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
        {isPending ? 'processing...' : 'Mark As Paid'}
      </Button>
    );
  };

  // Button to mark order as delivered
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
        {isPending ? 'processing...' : 'Mark As Delivered'}
      </Button>
    );
  };

  return (
    <div className='space-y-6'>
      {/* 4-Step Amazon Carrier Tracking Stepper */}
      <OrderTrackingStepper
        orderId={id}
        isPaid={isPaid}
        isDelivered={isDelivered}
      />

      <div className='grid md:grid-cols-3 md:gap-5'>
        <div className='col-span-2 space-y-4 overflow-x-auto'>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4 font-bold'>Payment Method</h2>
              <p className='mb-2 font-medium'>{paymentMethod}</p>
              {isPaid ? (
                <Badge variant='secondary' className='bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
                  Paid at {formatDateTime(paidAt!).dateTime}
                </Badge>
              ) : (
                <Badge variant='destructive'>Not paid</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4 font-bold'>Shipping Address</h2>
              <p className='font-semibold'>{shippingAddress.fullName}</p>
              <p className='mb-2 text-muted-foreground'>
                {shippingAddress.streetAddress}, {shippingAddress.city},{' '}
                {shippingAddress.postalCode}, {shippingAddress.country}
              </p>
              {isDelivered ? (
                <Badge variant='secondary' className='bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
                  Delivered at {formatDateTime(deliveredAt!).dateTime}
                </Badge>
              ) : (
                <Badge variant='outline' className='text-amber-600 border-amber-400'>
                  In Transit
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4 font-bold'>Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className='text-right'>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderitems.map((item) => (
                    <TableRow key={item.slug}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className='flex items-center gap-3 hover:text-primary transition'
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
                          <span className='font-medium line-clamp-2'>{item.name}</span>
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
              <h2 className='text-lg font-bold pb-2 border-b'>Order Summary</h2>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Items</span>
                <span>{formatCurrency(itemsPrice)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Estimated Tax</span>
                <span>{formatCurrency(taxPrice)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Shipping (Express)</span>
                <span className='text-emerald-600 font-semibold'>
                  {Number(shippingPrice) === 0 ? 'FREE' : formatCurrency(shippingPrice)}
                </span>
              </div>
              <div className='flex justify-between text-base font-extrabold pt-2 border-t'>
                <span>Order Total</span>
                <span className='text-emerald-600'>{formatCurrency(totalPrice)}</span>
              </div>

              {/* PayPal Payment */}
              {!isPaid && paymentMethod === 'PayPal' && (
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
              {!isPaid && paymentMethod === 'Stripe' && stripeClientSecret && (
                <div className='pt-2'>
                  <StripePayment
                    priceInCents={Number(order.totalPrice) * 100}
                    orderId={order.id}
                    clientSecret={stripeClientSecret}
                  />
                </div>
              )}

              {/* Cash On Delivery */}
              {isAdmin && !isPaid && paymentMethod === 'CashOnDelivery' && (
                <MarkAsPaidButton />
              )}
              {isAdmin && isPaid && !isDelivered && <MarkAsDeliveredButton />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsTable;
