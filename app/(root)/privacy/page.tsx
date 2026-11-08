import { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy information in test mode | ${APP_NAME}`,
  description: 'Information about account data and test-mode limits. No live purchase or supplier dispatch is active.',
};

export default function PolicyPage() {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6'>
      <article className='mx-auto max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10'>
        <p className='mb-5 inline-block rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'>Test mode - no live purchases or dispatch</p>
        <h1 className='text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl'>Privacy information in test mode</h1>
        <p className='mt-3 text-slate-600 dark:text-slate-300'>This test store is not an anonymous sandbox. Avoid entering sensitive or unnecessary personal information.</p>
        <div className='mt-8 space-y-7 text-sm leading-6 text-slate-700 dark:text-slate-300'>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Information entered in the store</h2>
            <p>Account registration, profile and address forms can store the information you enter. Support and service enquiry forms save the name, email and message you submit in the store inbox for the team to review. Signed-in enquiries are linked to that account; guest enquiries are not linked by matching email. Chat history is not forwarded automatically. Signing out ends your session; it does not erase your account or saved information. Use your account page to review or update the profile fields available there.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Sessions and preferences</h2>
            <p>The store uses cookies for sign-in, cart sessions, language and currency preferences. Do not enter card numbers, bank credentials or identity documents in profile fields, contact messages or the automated assistant.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>No live payment or supplier dispatch</h2>
            <p>Live checkout, customer confirmation emails and supplier dispatch are not active. A test receipt is not evidence that payment details were sent to a live processor or that shipping details were sent for a real shipment.</p>
          </section>
          <section>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-2'>Privacy questions and deletion requests</h2>
            <p>Automated store help cannot delete or anonymize an account, process a privacy request or confirm legal compliance. The contact page can save an enquiry in the store inbox; saving is not proof that the team has read, answered or processed the request. This page does not claim an automated erasure process, a response deadline or certification under privacy laws. A complete notice and a working request-handling process still need to be confirmed before live operation.</p>
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
