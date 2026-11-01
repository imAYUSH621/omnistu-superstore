import Link from 'next/link';
import { Package } from 'lucide-react';

export const metadata = { title: 'Track an order' };

// Tracking status is only shown on the signed-in order page, where it comes
// from the order record. This page never shows a status, carrier, tracking
// number or delivery date of its own.
export default function TrackPage() {
  return (
    <div className='w-full py-8 px-4 sm:px-6'>
      <div className='max-w-[700px] mx-auto rounded-lg border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-4'>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <Package className='w-6 h-6 text-amber-500' /> Track an order
        </h1>
        <p className='text-sm text-muted-foreground'>
          Order status is shown on your order page after you sign in. It shows
          the carrier and tracking number only once the order has been dispatched.
        </p>
        <div className='flex flex-wrap gap-3'>
          <Link href='/orders' className='px-4 py-2 rounded bg-amber-500 text-black text-sm font-semibold'>
            Go to your orders
          </Link>
          <Link href='/contact' className='px-4 py-2 rounded border text-sm font-semibold'>
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
