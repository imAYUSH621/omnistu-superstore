import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description: 'Terms of service, direct supplier dispatch agreement, and customer purchase conditions for Omnistu Superstore.',
};

export default function TermsPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
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
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4 text-emerald-500' /> 1. Direct-to-Consumer Model & Sourcing
            </h2>
            <p className='mb-3'>
              By placing an order on {APP_NAME}, you acknowledge and agree that our platform connects customers directly with vetted global manufacturing hubs and fulfillment networks (including CJ Dropshipping, Printify, and authenticated specialty producers).
            </p>
            <p>
              This operational model eliminates intermediary retail markups, warehouse hoarding fees, and speculative advertising costs, passing direct factory-floor savings to you.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Scale className='w-4 h-4 text-amber-500' /> 2. Pricing, Multi-Currency & Dynamic Conversion
            </h2>
            <p className='mb-3'>
              Product prices are computed dynamically based on real-time manufacturer wholesale costs, destination freight quotes, payment gateway interchange fees, and live interbank foreign exchange rates.
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li>Prices displayed in non-USD currencies (INR, EUR, GBP, CAD, AUD, JPY) are converted in real time using public exchange rates refreshed hourly.</li>
              <li>While we endeavor to guarantee real-time price accuracy, manufacturer cost changes or sudden currency volatility may lead to updated checkout totals prior to payment confirmation.</li>
              <li>All completed orders lock in the price at checkout; no retrospective surcharges will ever be levied.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <AlertTriangle className='w-4 h-4 text-amber-500' /> 3. Order Placement, Dispatch & Cancellation Window
            </h2>
            <p className='mb-3'>
              Orders are immediately routed into automated manufacturer production and packing queues upon payment validation.
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Cancellation Window:</strong> Orders may be amended or canceled within <strong>2 hours</strong> of placement before manufacturing and shipping labels are generated.</li>
              <li><strong>Automated Dispatch:</strong> Once tracking numbers are issued by carriers (USPS, YunExpress, DHL, India Post), orders are in transit and cannot be intercepted until delivered.</li>
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
