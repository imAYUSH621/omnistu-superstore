import { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Shipping and delivery information | ${APP_NAME}`,
  description: 'Test-mode information. Live ordering, payment, shipping and customer commercial terms are not active.',
};

export default function PolicyPage() {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6'>
      <article className='mx-auto max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10'>
        <p className='mb-5 inline-block rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'>Test mode - no live purchases or dispatch</p>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl'>Shipping and delivery information</h1>
        <p className='mt-3 text-slate-600 dark:text-slate-300'>Shipping is simulated while this store is in test mode.</p>
        <div className='mt-8 space-y-7 text-sm leading-6 text-slate-700 dark:text-slate-300'>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>No live dispatch</h2>
            <p>A test order does not reserve supplier inventory, create a supplier order or dispatch a parcel. A simulated shipping amount is not a live freight quote.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Each route needs confirmation</h2>
            <p>Available destinations, exact product and variant, quantity, warehouse, shipping method and freight cost must be confirmed together before live ordering. A reference quote for one postal code does not establish delivery coverage elsewhere.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Delivery estimates are not yet published</h2>
            <p>Supplier processing time and transit time are separate. Reference transit ranges are not delivery guarantees. No all-region carrier list or blanket processing timeframe has been confirmed for this store.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Tracking, duties and return shipping</h2>
            <p>Live tracking, customs handling, seller-borne duties and return shipping terms are not finalized. No carrier or tracking number should be treated as real unless it is supported by an actual dispatched order.</p>
          </section>
        </div>
        <nav aria-label='Store information' className='mt-9 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 dark:border-slate-800 pt-6 text-sm text-amber-700 dark:text-amber-300'>
          <Link href='/'>Return to store</Link>
          <Link href='/contact'>Contact</Link>
          <Link href='/terms'>Test-mode terms</Link>
          <Link href='/shipping-policy'>Shipping</Link>
          <Link href='/refund-policy'>Returns and refunds</Link>
          <Link href='/privacy'>Privacy</Link>
        </nav>
      </article>
    </div>
  );
}
