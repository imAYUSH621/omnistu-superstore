import React from 'react';
import Link from 'next/link';

export default function AmazonSignInBanner() {
  return (
    <div className='w-full bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] py-8 px-4 text-center rounded-none font-sans my-3 border-y border-neutral-100 dark:border-neutral-800'>
      <div className='max-w-md mx-auto space-y-2.5'>
        <p className='text-[14px] text-[#0f172a] dark:text-neutral-200 font-normal'>
          See personalized recommendations
        </p>
        <div>
          <Link href='/sign-in'>
            <button className='bg-[#4f46e5] hover:bg-[#4338ca] active:bg-[#f0b800] text-[#0f172a] text-[13px] font-bold py-1.5 px-24 sm:px-28 rounded-full shadow-xs border border-[#fcd200] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]'>
              Sign in
            </button>
          </Link>
        </div>
        <p className='text-[11px] text-[#0f172a] dark:text-neutral-400'>
          New customer?{' '}
          <Link
            href='/sign-up'
            className='text-[#4f46e5] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-medium'
          >
            Start here.
          </Link>
        </p>
      </div>
    </div>
  );
}
