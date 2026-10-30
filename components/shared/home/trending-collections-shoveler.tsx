'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollectionDeal {
  title: string;
  category: string;
  badge: string;
  discount: string;
  image: string;
  url: string;
}

const DEALS: CollectionDeal[] = [
  {
    title: 'Silicone Magnetic Balls & Sensory Decompression',
    category: 'Toys & Games',
    badge: 'Deal',
    discount: 'Up to 35% off',
    image: '/assets/images/41gk0-eoy4L._SR210,210_.jpg',
    url: '/s?k=sensory%20toys',
  },
  {
    title: 'Cyber Heavyweight Streetwear & Organic Hoodies',
    category: 'Fashion & Merch',
    badge: 'Printify Lab',
    discount: '300DPI Organic',
    image: '/assets/images/31-zpA1B2zL._SR210,210_.jpg',
    url: '/s?k=streetwear',
  },
  {
    title: 'Active Noise-Cancelling Wireless Earbuds Pro',
    category: 'Electronics & Audio',
    badge: 'Deal',
    discount: 'Save 40%',
    image: '/assets/images/417NhPd56zL._SR210,210_.jpg',
    url: '/s?k=headphones',
  },
  {
    title: 'Smart Coffee Mug Warmer & Constant Temp Coaster',
    category: 'Home & Kitchen',
    badge: 'Best Seller',
    discount: 'Limited time',
    image: '/assets/images/41opB3I6bHL._SR210,210_.jpg',
    url: '/s?k=kitchen',
  },
  {
    title: 'Smart Health & Sleep Tracker Fitness Ring',
    category: 'Smart Tech Gear',
    badge: 'Deal',
    discount: 'Up to 50% off',
    image: '/assets/images/41RKKF01YxL._SR210,210_.jpg',
    url: '/s?k=fitness%20trackers',
  },
  {
    title: 'Handcrafted Ultrasonic Aroma Diffuser Flame Light',
    category: 'Workspace Harmony',
    badge: 'Trending',
    discount: 'Save 25%',
    image: '/assets/images/31zR9dINh6L._SR210,210_.jpg',
    url: '/s?k=home%20decor',
  },
];

export default function TrendingCollectionsShoveler() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className='relative bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] p-5 rounded-none font-["Amazon_Ember",Arial,sans-serif] my-2 group'>
      {/* Header */}
      <div className='flex items-baseline justify-between mb-4'>
        <div className='flex items-baseline gap-3'>
          <h2 className='text-[21px] font-bold text-[#0F1111] dark:text-white leading-[27px] tracking-tight'>
            Today&apos;s Deals & Department Spotlights
          </h2>
          <span className='hidden sm:inline text-[13px] text-neutral-500 font-normal'>
            Prime early access & limited-time manufacturer promotions
          </span>
        </div>
        <Link
          href='/search?sort=deals'
          className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-normal shrink-0'
        >
          See all deals
        </Link>
      </div>

      {/* Left Paddle */}
      <button
        onClick={() => scroll('left')}
        className='absolute left-1 top-1/2 -translate-y-1/2 z-20 w-11 h-20 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-r border-y border-r border-[#d5d9d9] dark:border-neutral-700 shadow-[2px_0_5px_rgba(0,0,0,0.15)] flex items-center justify-center transition focus:outline-none'
        aria-label='Scroll Left'
      >
        <ChevronLeft className='w-6 h-6 text-neutral-800 dark:text-white' />
      </button>

      {/* Horizontal Track */}
      <div
        ref={scrollContainerRef}
        className='flex items-stretch gap-4 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {DEALS.map((deal, idx) => (
          <Link
            key={idx}
            href={deal.url}
            className='flex flex-col shrink-0 w-[200px] sm:w-[220px] p-2 hover:opacity-95 transition group/card cursor-pointer'
          >
            <div className='aspect-square relative w-full overflow-hidden bg-[#f7f7f7] dark:bg-neutral-800 rounded-none mb-2.5'>
              <Image
                src={deal.image}
                alt={deal.title}
                fill
                sizes='220px'
                className='object-cover group-hover/card:scale-105 transition-transform duration-200'
              />
            </div>
            {/* Badges */}
            <div className='flex items-center gap-1.5 mb-1.5'>
              <span className='bg-[#CC0C39] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-xs leading-none'>
                {deal.discount}
              </span>
              <span className='text-[11px] text-[#CC0C39] font-bold'>
                {deal.badge}
              </span>
            </div>
            {/* Title */}
            <span className='text-[13px] text-[#0F1111] dark:text-white leading-tight font-medium line-clamp-2 group-hover/card:text-[#c7511f] dark:group-hover/card:text-amber-400'>
              {deal.title}
            </span>
            <span className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-1'>
              {deal.category}
            </span>
          </Link>
        ))}
      </div>

      {/* Right Paddle */}
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
