'use client';

import React from 'react';
import T from '@/components/shared/i18n-text';
import Link from 'next/link';
import GlobalSelector from '@/components/shared/header/global-selector';
import { contentReviewMode } from '@/lib/content-review';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className='w-full bg-[#334155] text-white text-[13px] font-sans mt-12'>
      <p className='text-center px-4 py-2 text-xs'><a href='https://www.exchangerate-api.com' className='underline underline-offset-2'>Rates By Exchange Rate API</a></p>
      {/* 1. Back to Top Bar */}
      <button
        onClick={scrollToTop}
        className='w-full py-3.5 bg-[#475569] hover:bg-[#485769] transition text-center text-[13px] font-bold text-white tracking-tight cursor-pointer block focus:outline-none'
      >
        <T k='backToTop' />
      </button>

      {/* 2. 4-Column Directory */}
      <div className='max-w-[1000px] mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-3 gap-8 [&>div]:min-w-0 [overflow-wrap:anywhere]'>
        {/* Column 1 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'><T k='getToKnowUs' /></h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/' className='hover:underline hover:text-white'>
                <T k='footerAbout' />
              </Link>
            </li>
            <li>
              <Link href='/services' className='hover:underline hover:text-white'>
                <T k='footerServices' />
              </Link>
            </li>
            {contentReviewMode && (
              <li>
                <Link href='/blog' className='hover:underline hover:text-white'>
                  <T k='footerBlog' />
                </Link>
              </li>
            )}
            <li>
              <Link href='/shipping-policy' className='hover:underline hover:text-white'>
                <T k='footerShippingPolicy' />
              </Link>
            </li>
            <li>
              <Link href='/refund-policy' className='hover:underline hover:text-white'>
                <T k='footerRefundPolicy' />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'><T k='policies' /></h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/shipping-policy' className='hover:underline hover:text-white'>
                <T k='footerShippingPolicy' />
              </Link>
            </li>
            <li>
              <Link href='/privacy' className='hover:underline hover:text-white'>
                <T k='footerPrivacy' />
              </Link>
            </li>
            <li>
              <Link href='/terms' className='hover:underline hover:text-white'>
                <T k='footerTerms' />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'><T k='letUsHelpYou' /></h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/user/profile' className='hover:underline hover:text-white'>
                <T k='footerYourAccount' />
              </Link>
            </li>
            <li>
              <Link href='/user/orders' className='hover:underline hover:text-white'>
                <T k='footerOrdersTracking' />
              </Link>
            </li>
            <li>
              <Link href='/shipping-policy' className='hover:underline hover:text-white'>
                <T k='footerShippingRates' />
              </Link>
            </li>
            <li>
              <Link href='/refund-policy' className='hover:underline hover:text-white'>
                <T k='footerReturns' />
              </Link>
            </li>
            <li>
              <Link href='/contact' className='hover:underline hover:text-white'>
                <T k='footerContact' />
              </Link>
            </li>
            <li>
              <Link href='/privacy' className='hover:underline hover:text-white'>
                <T k='footerHelpCenter' />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Mid Footer: Logo & Interactive Global Selector */}
      <div className='border-t border-[#3a4553] py-6'>
        <div className='max-w-[1000px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <Link href='/' className='flex items-center gap-1.5'>
            <span className='font-extrabold text-[22px] tracking-tight text-white'>
              omnistu<span className='text-[#4f46e5] text-[16px] font-black'>.com</span>
            </span>
          </Link>

          {/* Interactive Global Currency & Language Selector */}
          <div className='flex items-center gap-3'>
            <GlobalSelector />
          </div>
        </div>
      </div>

      {/* 4. Sub-Footer Legal & Compliance Notice */}
      {/* Bottom padding clears the fixed AI Assistant launcher so legal links
      stay reachable and unobstructed at the page bottom. */}
      <div className='bg-[#131a22] pt-8 pb-20 sm:pb-16 text-[11px] text-[#999] text-center'>
        <div className='max-w-[1000px] mx-auto px-6 space-y-2'>
          <div className='flex flex-wrap items-center justify-center gap-4 text-[#ddd]'>
            <Link href='/terms' className='hover:underline'>
                <T k='footerTerms' />
              </Link>
            <Link href='/privacy' className='hover:underline'>
                <T k='footerPrivacy' />
              </Link>
            <Link href='/shipping-policy' className='hover:underline'>
                <T k='footerShippingCarrier' />
              </Link>
            <Link href='/refund-policy' className='hover:underline'>
                <T k='footerReturnsRefunds' />
              </Link>
          </div>
          <p className='text-[#999] pt-1'>
            © {new Date().getFullYear()} Omnistu Superstore. <T k='footerDemoNote' />
          </p>
        </div>
      </div>
    </footer>
  );
}
