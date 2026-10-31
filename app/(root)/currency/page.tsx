import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Coins, Globe2, ShieldCheck, CreditCard, ArrowRightLeft } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Multi-Currency & Zero FX Policy | ${APP_NAME}`,
  description: 'Shop in your local currency with transparent mid-market foreign exchange rates and zero hidden conversion surcharges.',
};

export default function CurrencyPolicyPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Coins className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Global Payments & Transparency</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            {APP_NAME} Multi-Currency & Fair FX Policy
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Last Updated: October 31, 2026 • Worldwide Currency & Pricing Standards
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <ArrowRightLeft className='w-4 h-4 text-amber-500' /> 1. Zero Hidden FX Markups
            </h2>
            <p className='mb-3'>
              Traditional marketplaces often add 3% to 5% hidden foreign transaction markups when customers buy goods
              sourced internationally. At {APP_NAME}, we believe in full financial transparency:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Real-Time Mid-Market Rates:</strong> All converted prices across USD ($), EUR (€), GBP (£), INR (₹), CAD (C$), and AUD (A$) use verified real-time institutional exchange rates.</li>
              <li><strong>Zero DCC Surcharges:</strong> We never apply predatory Dynamic Currency Conversion (DCC) fees. What you see in your cart is exactly what your bank or card statement will reflect.</li>
              <li><strong>Clear Price Breakdown:</strong> Product base price, calculated estimated local sales tax/VAT, and international shipping options are explicitly itemized prior to final payment authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Globe2 className='w-4 h-4 text-amber-500' /> 2. Supported Local Currencies
            </h2>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 my-4'>
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 text-center'>
                <span className='font-bold text-base block text-gray-900 dark:text-white'>USD ($)</span>
                <span className='text-xs text-gray-500'>United States Dollar</span>
              </div>
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 text-center'>
                <span className='font-bold text-base block text-gray-900 dark:text-white'>EUR (€)</span>
                <span className='text-xs text-gray-500'>Eurozone Standard</span>
              </div>
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 text-center'>
                <span className='font-bold text-base block text-gray-900 dark:text-white'>GBP (£)</span>
                <span className='text-xs text-gray-500'>British Pound Sterling</span>
              </div>
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 text-center'>
                <span className='font-bold text-base block text-gray-900 dark:text-white'>INR (₹)</span>
                <span className='text-xs text-gray-500'>Indian Rupee (UPI/Cards)</span>
              </div>
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 text-center'>
                <span className='font-bold text-base block text-gray-900 dark:text-white'>CAD (C$)</span>
                <span className='text-xs text-gray-500'>Canadian Dollar</span>
              </div>
              <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 text-center'>
                <span className='font-bold text-base block text-gray-900 dark:text-white'>AUD (A$)</span>
                <span className='text-xs text-gray-500'>Australian Dollar</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <CreditCard className='w-4 h-4 text-amber-500' /> 3. Secure International Payment Rails
            </h2>
            <p className='mb-3'>
              We partner with PCI-DSS Level 1 compliant processors to deliver seamless local payments in each supported region:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Global Credit & Debit:</strong> Visa, Mastercard, American Express, and Discover with 3D-Secure 2.0 biometric fraud verification.</li>
              <li><strong>PayPal Express:</strong> One-click checkout with automated currency routing and full PayPal Purchase Protection.</li>
              <li><strong>Regional Rails:</strong> Instant bank transfers, UPI for India, and Apple Pay / Google Pay on supported mobile devices.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <ShieldCheck className='w-4 h-4 text-amber-500' /> 4. Currency Refunds
            </h2>
            <p>
              When a refund is issued under our 30-Day Money-Back Guarantee, it is credited directly in the currency of your original purchase. The refunded amount corresponds to the exact purchase value authorized at checkout.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className='border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 flex flex-wrap gap-4 text-xs font-medium text-amber-600'>
          <Link href='/refund-policy' className='hover:underline'>Refund Policy</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/shipping-policy' className='hover:underline'>Shipping Policy</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/terms' className='hover:underline'>Conditions of Use</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/' className='hover:underline'>Return to Store</Link>
        </div>
      </div>
    </div>
  );
}
