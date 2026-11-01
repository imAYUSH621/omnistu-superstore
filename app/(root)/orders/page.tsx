import { Metadata } from 'next';
import Link from 'next/link';
import { getMyOrders } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Your Orders | Omnistu Superstore',
  description: 'Track, return, or buy items again.',
};

export default async function OrdersPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await props.searchParams;
  const orders = await getMyOrders({ page: Number(page) || 1 });

  return (
    <div className='mx-auto max-w-4xl px-4 py-8'>
      <h1 className='text-2xl font-bold mb-6'>Your Orders</h1>
      {orders.data.length === 0 ? (
        <p className='text-slate-600'>
          You have not placed any orders yet.{' '}
          <Link href='/search' className='text-indigo-600 underline'>
            Start shopping
          </Link>
        </p>
      ) : (
        <div className='space-y-4'>
          {orders.data.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className='block rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-400'
            >
              <div className='flex flex-wrap justify-between gap-2'>
                <div>
                  <div className='text-sm text-slate-500'>
                    Placed {formatDateTime(order.createdAt).dateTime}
                  </div>
                  <div className='text-sm text-slate-500'>Order {order.id}</div>
                </div>
                <div className='text-right'>
                  <div className='font-semibold'>
                    {formatCurrency(Number(order.totalPrice))}
                  </div>
                  <div className='text-sm'>
                    {order.isPaid ? (
                      <span className='text-green-700'>Paid</span>
                    ) : (
                      <span className='text-amber-700'>Awaiting payment</span>
                    )}
                    {' - '}
                    {order.isDelivered ? (
                      <span className='text-green-700'>Delivered</span>
                    ) : (
                      <span className='text-slate-600'>Not delivered</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
