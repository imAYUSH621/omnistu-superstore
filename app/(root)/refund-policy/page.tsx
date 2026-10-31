import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, CheckCircle, AlertCircle, PackageCheck, HelpCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Refund & Replacement Policy | ${APP_NAME}`,
  description: 'Grounded return, refund, and replacement policy based on verified global manufacturer and carrier inspection terms.',
};

export default function RefundPolicyPage() {
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
            {APP_NAME} Refund & Replacement Policy
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Direct Manufacturer & Fulfiller Standard • 100% Risk-Free Guarantee for Defective or Lost Goods
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          {/* Quick Summary Banner */}
          <div className='bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-5'>
            <div className='flex items-start gap-3'>
              <CheckCircle className='w-5 h-5 text-emerald-600 mt-0.5 shrink-0' />
              <div>
                <h3 className='font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-1'>
                  Our Zero-Risk Buyer Promise
                </h3>
                <p className='text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm'>
                  Because our store operates on direct automated supplier fulfillment (CJ Dropshipping, Printify, and artisan hubs), we adhere strictly to official fulfiller dispute resolution rules. If your item arrives broken, defective, or goes missing in transit, you are <strong>100% covered</strong> for an immediate free replacement or refund.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <PackageCheck className='w-4 h-4 text-amber-500' /> 1. Eligible Conditions for 100% Free Replacement or Refund
            </h2>
            <p className='mb-3'>
              Fulfillers approve instant claims under the following circumstances:
            </p>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <strong>Damaged or Defective on Arrival:</strong> If an electronic item fails to power on, jewelry/watch crystal is damaged, or garments have torn stitching upon unboxing, report it within <strong>7 calendar days</strong> of confirmed delivery with clear photos or a short video clip showing the defect.
              </li>
              <li>
                <strong>Incorrect Item / Wrong Size Dispatched:</strong> If the manufacturer inadvertently dispatched a product or variant different from your confirmed order, an immediate correct replacement is dispatched at zero cost.
              </li>
              <li>
                <strong>Lost in Transit:</strong> If carrier tracking (USPS, YunExpress, DHL, India Post) shows no movement for more than <strong>30 consecutive days</strong> (or package is declared officially lost by the carrier), we issue an automatic 100% refund or expedited reshipment.
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <AlertCircle className='w-4 h-4 text-amber-500' /> 2. Special Category Regulations
            </h2>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <strong>Gourmet Indian Food & Botanicals:</strong> (Saffron, Vedic Ghee, Heritage Teas, Mango Puree). In accordance with international and domestic food safety regulations, consumable grocery products cannot be returned once the protective seal is broken. If damaged during transit, full refunds or replacements are granted upon photo submission of the parcel.
              </li>
              <li>
                <strong>Print-on-Demand Apparel (Printify):</strong> Items are custom printed individually for your order. Because inventory is not pre-mass-produced, please consult our sizing chart carefully prior to ordering. Size remorse returns cannot be restocked by the printer.
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <HelpCircle className='w-4 h-4 text-amber-500' /> 3. How to Submit a Claim in Under 2 Minutes
            </h2>
            <ol className='list-decimal pl-5 space-y-2'>
              <li>Locate your <strong>Order ID</strong> (from your confirmation email) and checkout email.</li>
              <li>Open our <strong>24/7 AI Concierge</strong> widget on the bottom right or email <span className='font-mono font-bold text-amber-600'>support@omnistu.com</span>.</li>
              <li>Provide a concise description of the issue along with a photo/video attachment.</li>
              <li>Our automated claim system relays the evidence directly to the fulfilling supplier API; valid claims are typically approved within <strong>24 to 48 business hours</strong>.</li>
            </ol>
          </section>
        </div>

        {/* Back button */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs'>
          <Link href='/' className='text-amber-600 hover:underline font-bold'>
            ← Return to Store
          </Link>
          <div className='flex gap-4 text-gray-500'>
            <Link href='/terms' className='hover:underline'>Terms of Service</Link>
            <Link href='/privacy' className='hover:underline'>Privacy Notice</Link>
            <Link href='/shipping-policy' className='hover:underline'>Shipping Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
