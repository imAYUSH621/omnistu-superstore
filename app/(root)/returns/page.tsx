import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, PackageCheck, Truck, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Returns & Replacements | ${APP_NAME}`,
  description: 'Learn about our 30-Day Hassle-Free Returns & Replacements process for orders direct from global makers.',
};

export default function ReturnsPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <RotateCcw className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Customer Protection</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            {APP_NAME} Returns & Replacements
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Last Updated: October 31, 2026 • 30-Day Money-Back Guarantee
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <ShieldCheck className='w-4 h-4 text-amber-500' /> 1. The Omnistu 30-Day Return Standard
            </h2>
            <p className='mb-3'>
              We stand behind every item shipped by our verified maker network. If your item arrives damaged, defective,
              or is significantly not as described, you are protected by our 30-Day Money-Back Guarantee from the date of confirmed delivery.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <PackageCheck className='w-4 h-4 text-amber-500' /> 2. Fast 3-Step Return Process
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 my-4'>
              <div className='p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700'>
                <span className='w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs mb-2'>1</span>
                <h3 className='font-bold text-sm text-gray-900 dark:text-white mb-1'>Initiate Claim</h3>
                <p className='text-xs text-gray-500'>Email support@omnistu.com with your order number (e.g. OMN-...) and photos of the item.</p>
              </div>
              <div className='p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700'>
                <span className='w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs mb-2'>2</span>
                <h3 className='font-bold text-sm text-gray-900 dark:text-white mb-1'>Instant Resolution</h3>
                <p className='text-xs text-gray-500'>For broken, defective, or misprinted items, we issue an immediate free replacement or full refund without requiring physical return shipping.</p>
              </div>
              <div className='p-4 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700'>
                <span className='w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs mb-2'>3</span>
                <h3 className='font-bold text-sm text-gray-900 dark:text-white mb-1'>Refund Credit</h3>
                <p className='text-xs text-gray-500'>Funds are returned directly to your original payment card, PayPal, or bank within 3 to 5 business days.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Truck className='w-4 h-4 text-amber-500' /> 3. Need to Track an Existing Shipment?
            </h2>
            <p className='mb-3'>
              If you are waiting for an item in transit, you can check its live real-time carrier status anytime using your order ID:
            </p>
            <Link href='/track' className='inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded shadow transition'>
              Track Your Package ✈
            </Link>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className='border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 flex flex-wrap gap-4 text-xs font-medium text-amber-600'>
          <Link href='/refund-policy' className='hover:underline'>Full Refund Policy</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/shipping-policy' className='hover:underline'>Carrier & Shipping Policy</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/terms' className='hover:underline'>Conditions of Use</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/' className='hover:underline'>Return to Store</Link>
        </div>
      </div>
    </div>
  );
}
