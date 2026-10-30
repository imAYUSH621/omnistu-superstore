'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DepartmentItem {
  name: string;
  image: string;
  url: string;
  tag: string;
}

const DEPARTMENTS: DepartmentItem[] = [
  {
    name: 'Electronics & Tech',
    image: '/assets/images/417NhPd56zL._SR210,210_.jpg',
    url: '/search?category=Electronics %26 Gadgets',
    tag: '1,200+ Items',
  },
  {
    name: 'Apparel & Streetwear',
    image: '/assets/images/31-zpA1B2zL._SR210,210_.jpg',
    url: '/search?category=Apparel %26 Merch',
    tag: 'Printify Lab',
  },
  {
    name: 'Home & Kitchen',
    image: '/assets/images/41opB3I6bHL._SR210,210_.jpg',
    url: '/search?category=Home %26 Kitchen',
    tag: 'Kitchen & Decor',
  },
  {
    name: 'Sensory & Toys',
    image: '/assets/images/41gk0-eoy4L._SR210,210_.jpg',
    url: '/search?category=Toys %26 Games',
    tag: 'Stress Relief',
  },
  {
    name: 'Fitness & Sports',
    image: '/assets/images/41MjMjLh9BL._SR210,210_.jpg',
    url: '/s?k=fitness',
    tag: 'Active Gear',
  },
  {
    name: 'Laptops & PCs',
    image: '/assets/images/31aw+nYkUmL._SR210,210_.jpg',
    url: '/s?k=computers',
    tag: 'High Performance',
  },
  {
    name: 'Audio & Wireless',
    image: '/assets/images/41uuEMle6TL._SR210,210_.jpg',
    url: '/s?k=speakers',
    tag: 'Surround Sound',
  },
  {
    name: 'Women\'s Fashion',
    image: '/assets/images/41DNYos4L1L._SR210,210_.jpg',
    url: '/s?k=Women%20Clothing',
    tag: 'Curated Drops',
  },
  {
    name: 'Smart Gadgets',
    image: '/assets/images/41dMYqsSuGL._SR210,210_.jpg',
    url: '/s?k=electronics%20tablets',
    tag: 'Next-Gen Tech',
  },
  {
    name: 'Home Decor',
    image: '/assets/images/31zR9dINh6L._SR210,210_.jpg',
    url: '/s?k=home%20decor',
    tag: 'Living Harmony',
  },
];

export default function DepartmentShoveler() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className='relative bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] p-5 rounded-none font-["Amazon_Ember",Arial,sans-serif] my-2 group'>
      {/* Header Row */}
      <div className='flex items-baseline justify-between mb-4'>
        <div className='flex items-baseline gap-3'>
          <h2 className='text-[21px] font-bold text-[#0F1111] dark:text-white leading-[27px] tracking-tight'>
            Explore Popular Categories & Departments
          </h2>
          <span className='hidden sm:inline text-[13px] text-neutral-500 font-normal'>
            Direct manufacturer catalogs via CJ Dropshipping & Printify
          </span>
        </div>
        <Link
          href='/search'
          className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-normal shrink-0'
        >
          See all categories
        </Link>
      </div>

      {/* Left Navigation Paddle */}
      <button
        onClick={() => scroll('left')}
        className='absolute left-1 top-1/2 -translate-y-1/2 z-20 w-11 h-20 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-r border-y border-r border-[#d5d9d9] dark:border-neutral-700 shadow-[2px_0_5px_rgba(0,0,0,0.15)] flex items-center justify-center transition focus:outline-none'
        aria-label='Scroll Left'
      >
        <ChevronLeft className='w-6 h-6 text-neutral-800 dark:text-white' />
      </button>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        className='flex items-center gap-5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {DEPARTMENTS.map((dept, idx) => (
          <Link
            key={idx}
            href={dept.url}
            className='flex flex-col items-center shrink-0 w-[128px] sm:w-[140px] group/item text-center cursor-pointer'
          >
            {/* Circular Category Thumbnail with Subtle Border */}
            <div className='w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden relative bg-[#f7f7f7] dark:bg-neutral-800 border-2 border-neutral-100 dark:border-neutral-700 shadow-xs mb-2 transition-transform duration-200 group-hover/item:scale-105'>
              <Image
                src={dept.image}
                alt={dept.name}
                fill
                sizes='120px'
                className='object-cover'
              />
            </div>
            {/* Title & Tag */}
            <span className='text-[13px] font-bold text-[#0F1111] dark:text-white leading-tight group-hover/item:text-[#c7511f] dark:group-hover/item:text-amber-400 line-clamp-2'>
              {dept.name}
            </span>
            <span className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-normal'>
              {dept.tag}
            </span>
          </Link>
        ))}
      </div>

      {/* Right Navigation Paddle */}
      <button
        onClick={() => scroll('right')}
        className='absolute right-1 top-1/2 -translate-y-1/2 z-20 w-11 h-20 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-l border-y border-l border-[#d5d9d9] dark:border-neutral-700 shadow-[-2px_0_5px_rgba(0,0,0,0.15)] flex items-center justify-center transition focus:outline-none'
        aria-label='Scroll Right'
      >
        <ChevronRight className='w-6 h-6 text-neutral-800 dark:text-white' />
      </button>
    </div>
  );
}
