'use client';

import React from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className='w-full bg-[#232f3e] text-white text-[13px] font-["Amazon_Ember",Arial,sans-serif] mt-12'>
      {/* 1. Back to Top Bar */}
      <button
        onClick={scrollToTop}
        className='w-full py-3.5 bg-[#37475a] hover:bg-[#485769] transition text-center text-[13px] font-bold text-white tracking-tight cursor-pointer block focus:outline-none'
      >
        Back to top
      </button>

      {/* 2. 4-Column Directory */}
      <div className='max-w-[1000px] mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8'>
        {/* Column 1 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'>Get to Know Us</h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/search' className='hover:underline hover:text-white'>
                Careers
              </Link>
            </li>
            <li>
              <Link href='/search' className='hover:underline hover:text-white'>
                Blog
              </Link>
            </li>
            <li>
              <Link href='/' className='hover:underline hover:text-white'>
                About {APP_NAME}
              </Link>
            </li>
            <li>
              <Link href='/search' className='hover:underline hover:text-white'>
                Investor Relations
              </Link>
            </li>
            <li>
              <Link href='/search' className='hover:underline hover:text-white'>
                Omnistu Science Devices
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'>Make Money with Us</h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/admin' className='hover:underline text-amber-400 font-bold'>
                ⚙ Seller Central / Admin
              </Link>
            </li>
            <li>
              <Link href='/admin' className='hover:underline hover:text-white'>
                Sell on {APP_NAME}
              </Link>
            </li>
            <li>
              <Link href='/admin' className='hover:underline hover:text-white'>
                Supply via CJ Dropshipping
              </Link>
            </li>
            <li>
              <Link href='/admin' className='hover:underline hover:text-white'>
                Printify On-Demand Lab
              </Link>
            </li>
            <li>
              <Link href='/admin' className='hover:underline hover:text-white'>
                Become an Affiliate
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'>Payment Products</h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/cart' className='hover:underline hover:text-white'>
                Omnistu Rewards Visa
              </Link>
            </li>
            <li>
              <Link href='/cart' className='hover:underline hover:text-white'>
                Shop with Points
              </Link>
            </li>
            <li>
              <Link href='/cart' className='hover:underline hover:text-white'>
                Reload Your Balance
              </Link>
            </li>
            <li>
              <Link href='/cart' className='hover:underline hover:text-white'>
                Currency Converter
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3 className='font-bold text-[15px] mb-3 text-white'>Let Us Help You</h3>
          <ul className='space-y-2 text-[#DDD]'>
            <li>
              <Link href='/orders' className='hover:underline hover:text-white'>
                Your Account
              </Link>
            </li>
            <li>
              <Link href='/orders' className='hover:underline hover:text-white'>
                Your Orders & Tracking
              </Link>
            </li>
            <li>
              <Link href='/orders' className='hover:underline hover:text-white'>
                Shipping Rates & Policies
              </Link>
            </li>
            <li>
              <Link href='/orders' className='hover:underline hover:text-white'>
                Returns & Replacements
              </Link>
            </li>
            <li>
              <Link href='/admin' className='hover:underline hover:text-white'>
                Help & Support Center
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Mid Footer: Logo & Region */}
      <div className='border-t border-[#3a4553] py-6'>
        <div className='max-w-[1000px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6'>
          <Link href='/' className='flex items-center gap-1.5'>
            <span className='font-extrabold text-[22px] tracking-tight text-white'>
              omnistu<span className='text-[#ff9900] text-[16px] font-black'>.us</span>
            </span>
          </Link>

          <div className='flex items-center gap-3 text-[12px]'>
            <div className='border border-[#848688] rounded px-2.5 py-1 flex items-center gap-1.5 text-[#ccc] cursor-pointer hover:border-white'>
              <Globe className='w-3.5 h-3.5' />
              <span>English</span>
            </div>
            <div className='border border-[#848688] rounded px-2.5 py-1 text-[#ccc] cursor-pointer hover:border-white'>
              <span>$ USD - U.S. Dollar</span>
            </div>
            <div className='border border-[#848688] rounded px-2.5 py-1 text-[#ccc] cursor-pointer hover:border-white'>
              <span>United States</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sub-Footer Legal & Trademark Notice */}
      <div className='bg-[#131a22] py-8 text-[11px] text-[#999] text-center'>
        <div className='max-w-[1000px] mx-auto px-6 space-y-2'>
          <div className='flex flex-wrap items-center justify-center gap-4 text-[#ddd]'>
            <Link href='/orders' className='hover:underline'>
              Conditions of Use
            </Link>
            <Link href='/orders' className='hover:underline'>
              Privacy Notice
            </Link>
            <Link href='/orders' className='hover:underline'>
              Consumer Health Data Privacy
            </Link>
            <Link href='/orders' className='hover:underline'>
              Your Ads Privacy Choices
            </Link>
          </div>
          <p className='text-[#999] pt-1'>
            © 1996–{new Date().getFullYear()}, Omnistu Superstore, Inc. or its affiliates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
