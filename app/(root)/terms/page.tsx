import { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Store test-mode information | ${APP_NAME}`,
  description: 'Test-mode information. Live ordering, payment, shipping and customer commercial terms are not active.',
};

export default function PolicyPage() {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6'>
      <article className='mx-auto max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10'>
        <p className='mb-5 inline-block rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'>Test mode - no live purchases or dispatch</p>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl'>Store test-mode information</h1>
        <p className='mt-3 text-slate-600 dark:text-slate-300'>Live purchase terms are not in effect.</p>
        <div className='mt-8 space-y-7 text-sm leading-6 text-slate-700 dark:text-slate-300'>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Test operation</h2>
            <p>This store is being tested. Test orders and simulated payment receipts do not charge a card, authorize a real payment, reserve supplier stock or start manufacturing or dispatch.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Prices and costs</h2>
            <p>Reference supplier costs and freight samples are not complete landed costs or approved retail prices. Unknown handling, tax, duties, payment fees and return costs must not be treated as zero. Test totals are for simulation only.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Before live ordering</h2>
            <p>Product and variant details, available shipping routes, final prices, applicable taxes, cancellation and return terms, payment eligibility and fulfillment must be confirmed before live ordering is enabled.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>No live effective date</h2>
            <p>There is no effective date for live purchase terms yet. This page does not set a cancellation window, guarantee supplier acceptance or promise a refund outcome.</p>
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
