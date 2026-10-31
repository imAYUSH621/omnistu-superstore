import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Truck, RefreshCw } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Notice | ${APP_NAME}`,
  description: 'Learn how Omnistu Superstore collects, uses, and protects customer information in compliance with global e-commerce and carrier standards.',
};

export default function PrivacyPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <ShieldCheck className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Trust & Compliance</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            {APP_NAME} Privacy Notice
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Last Updated: October 31, 2026 • Effective Immediately Across All Global Regions
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Lock className='w-4 h-4 text-amber-500' /> 1. Information We Collect
            </h2>
            <p className='mb-3'>
              When you purchase or interact with {APP_NAME}, we collect necessary data to fulfill orders, prevent fraud, and deliver localized currency pricing:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Contact & Shipping Data:</strong> Full name, delivery address, postal/PIN code, email address, and phone number for carrier contact during delivery.</li>
              <li><strong>Payment Information:</strong> Processed securely via end-to-end tokenized payment gateways (Stripe, PayPal, UPI). We <em>never</em> store raw card numbers, CVVs, or bank credentials on our servers.</li>
              <li><strong>Technical & Session Data:</strong> IP address, browser language preferences, selected currency, and device telemetry to ensure responsive edge rendering and currency conversion.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Truck className='w-4 h-4 text-amber-500' /> 2. Fulfiller & Carrier Data Sharing
            </h2>
            <p className='mb-3'>
              To honor our direct-to-consumer pricing and global dispatch, order details are transmitted strictly on a need-to-know basis to our vetted fulfillment and logistics partners:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Fulfillment Networks:</strong> CJ Dropshipping Inc., Printify Inc., and certified regional suppliers for product packing and dispatch.</li>
              <li><strong>Carriers & Customs Authorities:</strong> USPS, YunExpress, DHL Express, India Post, and Blue Dart solely to generate shipping waybills, compute customs tariffs, and transmit SMS/email delivery tracking.</li>
              <li>We <strong>do not sell, rent, or trade</strong> customer data to third-party ad brokers or data aggregators.</li>
            </ul>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <RefreshCw className='w-4 h-4 text-amber-500' /> 3. Data Retention & Consumer Rights
            </h2>
            <p className='mb-3'>
              You maintain full ownership of your personal data under GDPR, CCPA, and Indian Digital Personal Data Protection (DPDP) standards:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Right of Access & Correction:</strong> Review or update your profile and order history at any time from your account dashboard.</li>
              <li><strong>Right to Erasure:</strong> Contact our automated AI Concierge or support desk to request irreversible anonymization of your profile once all active order fulfillment periods have closed.</li>
              <li><strong>Data Security:</strong> All transit is encrypted via TLS 1.3 with Cloudflare edge caching protection and strict role-based data isolation.</li>
            </ul>
          </section>

          <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200'>
            <strong>Questions regarding privacy?</strong> Contact our data privacy officer at{' '}
            <span className='font-mono underline'>privacy@omnistu.com</span> or open a session with our 24/7 AI Concierge.
          </div>
        </div>

        {/* Back button */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs'>
          <Link href='/' className='text-amber-600 hover:underline font-bold'>
            ← Return to Store
          </Link>
          <div className='flex gap-4 text-gray-500'>
            <Link href='/terms' className='hover:underline'>Terms of Service</Link>
            <Link href='/shipping-policy' className='hover:underline'>Shipping Policy</Link>
            <Link href='/refund-policy' className='hover:underline'>Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
