import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Target, Shield, Settings, EyeOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Interest-Based Ads Notice | ${APP_NAME}`,
  description: 'Learn how Omnistu Superstore uses interest-based advertising to showcase relevant maker innovations and how you can manage your advertising preferences.',
};

export default function InterestBasedAdsPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>
        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Target className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Advertising Preferences & Transparency</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            {APP_NAME} Interest-Based Ads Notice
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Last Updated: October 31, 2026 • Global Advertising & Cookie Compliance
          </p>
        </div>

        {/* Content Body */}
        <div className='space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Shield className='w-4 h-4 text-amber-500' /> 1. What Are Interest-Based Ads?
            </h2>
            <p className='mb-3'>
              Interest-based ads (sometimes referred to as personalized or targeted advertising) are product recommendations
              and promotional displays tailored to your shopping interests. On {APP_NAME}, we aim to show you relevant
              maker innovations, archival apparel, and organic botanicals that match your search intent and browsing preferences,
              rather than generic repetitive ads.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Settings className='w-4 h-4 text-amber-500' /> 2. Information Used to Serve Ads
            </h2>
            <p className='mb-3'>
              To serve relevant product suggestions without compromising your privacy, we may utilize:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li>Your interactions on {APP_NAME}, such as searched keywords, viewed products, and cart additions.</li>
              <li>General non-precise geographic location (such as city or country level) to display regional shipping speeds and local currency pricing.</li>
              <li>Cookie identifiers and pixel tags that help prevent showing you the exact same product repeatedly.</li>
            </ul>
            <p className='mt-3 text-xs text-gray-500'>
              We do not sell personal identification data (such as your full name, raw payment information, or physical street address) to third-party ad brokers.
            </p>
          </section>

          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <EyeOff className='w-4 h-4 text-amber-500' /> 3. How to Control Your Advertising Preferences
            </h2>
            <p className='mb-3'>
              You maintain total control over your advertising experience. You can opt out of interest-based ads anytime:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              <li><strong>Browser Settings:</strong> You can configure your browser to block third-party cookies or alert you when cookies are sent.</li>
              <li><strong>Do Not Track (DNT) / GPC:</strong> Our systems honor standard Global Privacy Control (GPC) signals sent by modern web browsers.</li>
              <li><strong>Industry Opt-Out Portals:</strong> You can visit the <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">Digital Advertising Alliance (DAA)</a> or the <a href="https://youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">European Interactive Digital Advertising Alliance (EDAA)</a> to opt out across participating advertising networks.</li>
            </ul>
          </section>

          <section className='bg-amber-50 dark:bg-amber-950/20 p-5 rounded-md border border-amber-200 dark:border-amber-900/40 text-xs text-gray-600 dark:text-gray-400'>
            <p>
              Please note that opting out of interest-based advertising does not mean you will no longer see product suggestions.
              You will continue to see non-personalized product listings based on the specific page context or search query you are exploring.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className='border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 flex flex-wrap gap-4 text-xs font-medium text-amber-600'>
          <Link href='/privacy' className='hover:underline'>Privacy Notice</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/terms' className='hover:underline'>Conditions of Use</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/shipping-policy' className='hover:underline'>Shipping Policy</Link>
          <span className='text-gray-300'>•</span>
          <Link href='/' className='hover:underline'>Return to Store</Link>
        </div>
      </div>
    </div>
  );
}
