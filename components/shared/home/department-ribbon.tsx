'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Laptop, 
  Shirt, 
  Home, 
  Gamepad2, 
  Sparkles, 
  Dumbbell, 
  BookOpen, 
  Headphones, 
  HeartPulse, 
  Car 
} from 'lucide-react';

const DEPARTMENTS = [
  { name: 'Electronics & Gadgets', icon: Laptop, query: 'electronics', count: '1,200+ items' },
  { name: 'Apparel & Streetwear', icon: Shirt, query: 'clothing', count: '850+ items' },
  { name: 'Home & Kitchen', icon: Home, query: 'home and kitchen', count: '1,500+ items' },
  { name: 'Toys & Sensory Fidgets', icon: Gamepad2, query: 'toys and games', count: '450+ items' },
  { name: 'Beauty & Skincare', icon: Sparkles, query: 'beauty', count: '600+ items' },
  { name: 'Fitness & Sports', icon: Dumbbell, query: 'fitness', count: '400+ items' },
  { name: 'Books & Learning', icon: BookOpen, query: 'books', count: '900+ items' },
  { name: 'Audio & Wireless', icon: Headphones, query: 'audio', count: '350+ items' },
  { name: 'Health & Wellness', icon: HeartPulse, query: 'health', count: '500+ items' },
  { name: 'Automotive & Tools', icon: Car, query: 'automotive', count: '300+ items' },
];

export default function DepartmentRibbon() {
  return (
    <div className='my-8 bg-white dark:bg-[#1a202c] shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 p-5 rounded-none'>
      <div className='flex items-center justify-between mb-4 border-b border-[#e7e7e7] dark:border-neutral-800 pb-2'>
        <div>
          <h2 className='text-[18px] md:text-[20px] font-bold text-[#0f1111] dark:text-white tracking-tight'>
            Shop by Category & Department
          </h2>
          <p className='text-[12px] text-[#565959] dark:text-neutral-400'>
            Explore Amazon & Omnistu verified supplier catalogs with fast fulfillment
          </p>
        </div>
        <Link
          href='/s?k=all+departments'
          className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-medium'
        >
          View all categories &rarr;
        </Link>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
        {DEPARTMENTS.map((dept) => {
          const IconComponent = dept.icon;
          return (
            <Link
              key={dept.name}
              href={`/s?k=${encodeURIComponent(dept.query)}`}
              className='group flex items-center gap-3 p-3 rounded border border-neutral-200/80 dark:border-neutral-800 bg-[#fbfbfb] dark:bg-neutral-800/40 hover:bg-[#f0f2f2] dark:hover:bg-neutral-800 hover:border-[#007185] transition-all cursor-pointer'
            >
              <div className='p-2.5 rounded-full bg-white dark:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-600 group-hover:scale-110 transition-transform'>
                <IconComponent className='w-5 h-5 text-[#007185] dark:text-[#56b6c2]' />
              </div>
              <div className='flex flex-col min-w-0'>
                <span className='text-[13px] font-semibold text-[#0f1111] dark:text-white group-hover:text-[#c7511f] truncate'>
                  {dept.name}
                </span>
                <span className='text-[11px] text-[#565959] dark:text-neutral-400'>
                  {dept.count}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
