import { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Refund and replacement information | ${APP_NAME}`,
  description: 'Test-mode information. Live ordering, payment, shipping and customer commercial terms are not active.',
};

export default function PolicyPage() {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6'>
      <article className='mx-auto max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10'>
        <p className='mb-5 inline-block rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'>Test mode - no live purchases or dispatch</p>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl'>Refund and replacement information</h1>
        <p className='mt-3 text-slate-600 dark:text-slate-300'>Returns and refunds are not active in this test store.</p>
        <div className='mt-8 space-y-7 text-sm leading-6 text-slate-700 dark:text-slate-300'>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Test orders only</h2>
            <p>Orders placed in test mode do not charge a card or send a product. A simulated payment or receipt is not evidence of a real purchase, refund or supplier acceptance.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Live return terms are not finalized</h2>
            <p>Return eligibility, evidence requirements, reporting windows, return destinations and who pays return shipping still need to be confirmed for each product and destination before live ordering. Supplier dispute rules do not automatically become the store&apos;s customer return policy.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>No automatic approval promise</h2>
            <p>There is no live automated supplier-claim approval or guaranteed refund turnaround. Do not mail a return to a supplier address without confirmed instructions.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Questions about a test order</h2>
            <p>Sign in to view the order record. Use the contact page for questions and include the order ID if available. Customer confirmation emails and live claim processing are not active.</p>
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
