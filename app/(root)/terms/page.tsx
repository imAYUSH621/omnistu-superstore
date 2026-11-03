import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { contentReviewMode } from '@/lib/content-review';

export const metadata: Metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: 'Terms of service, direct supplier dispatch agreement, and customer purchase conditions for Omnistu Superstore.',
};

export default function TermsPage() {
  return (
    <div className='w-full min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] py-8 px-4 sm:px-6 font-sans'>
        <p className='mb-4 inline-block rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'>Draft policy - proposed terms, not yet in effect. This demo store is in test mode.</p>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <FileText className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Legal Agreement</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            {APP_NAME} Terms of Service
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Effective Date: October 31, 2026 • Governs All Purchases & Catalog Usage
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          {contentReviewMode && (<section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-emerald-500' /> 1. Direct-to-Consumer Model & Sourcing
            </h2>
            <p className='mb-3'>
              By placing an order on {APP_NAME}, you acknowledge and agree that our platform connects customers directly with vetted global manufacturing hubs and fulfillment networks (including CJ Dropshipping, Printify, and authenticated specialty producers).
            </p>
            <p>
              This operational model eliminates intermediary retail markups, warehouse hoarding fees, and speculative advertising costs, passing direct factory-floor savings to you.
            </p>
          </section>)}

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Scale className='w-4 h-4 text-amber-500' /> 2. Pricing, Multi-Currency & Dynamic Conversion
            </h2>
            {contentReviewMode && (<p className='mb-3'>
              Product prices are computed dynamically based on real-time manufacturer wholesale costs, destination freight quotes, payment gateway interchange fees, and live interbank foreign exchange rates.
            </p>)}
            <ul className='list-disc pl-5 space-y-1.5'>
              <li>Some browsing pages can display indicative prices in non-USD currencies converted with periodically refreshed public exchange rates. Cart and checkout totals are currently always computed and charged in USD.</li>
              <li>While we endeavor to guarantee real-time price accuracy, manufacturer cost changes or sudden currency volatility may lead to updated checkout totals prior to payment confirmation.</li>
              <li>All completed orders lock in the price at checkout; no retrospective surcharges will ever be levied.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <AlertTriangle className='w-4 h-4 text-amber-500' /> 3. Order Placement, Dispatch & Cancellation Window
            </h2>
            <p className='mb-3'>
              During test operation, orders are simulated and no manufacturing or dispatch takes place. Automated supplier routing is planned for live operation and is not active yet.
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Cancellation:</strong> during test operation, reach out via the contact page before any dispatch; a formal cancellation window will be published when live ordering starts.</li>
              {contentReviewMode && (<li><strong>Automated Dispatch:</strong> Once tracking numbers are issued by carriers (USPS, YunExpress, DHL, India Post), orders are in transit and cannot be intercepted until delivered.</li>)}
              <li><strong>Fraud Prevention:</strong> We reserve the right to void or refund orders identified as high risk or containing invalid shipping destinations.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <FileText className='w-4 h-4 text-amber-500' /> 4. Intellectual Property & Brand Clarification
            </h2>
            <p>
              {APP_NAME} is an independent multi-department e-commerce platform. Amazon®, Stripe®, PayPal®, and carrier brand names referenced in technical or logistical contexts remain the trademarks of their respective owners and do not imply direct endorsement or corporate affiliation.
            </p>
          </section>
        </div>

        {/* Back button */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs'>
          <Link href='/' className='text-amber-600 hover:underline font-bold'>
            ← Return to Store
          </Link>
          <div className='flex gap-4 text-gray-500'>
            <Link href='/privacy' className='hover:underline'>Privacy Notice</Link>
            <Link href='/shipping-policy' className='hover:underline'>Shipping Policy</Link>
            <Link href='/refund-policy' className='hover:underline'>Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
