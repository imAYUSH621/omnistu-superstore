'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductImage } from '@/components/shared/product/product-image';

// Category tiles use the store's own generated artwork (public/images/categories),
// not marketplace product photos. Illustrative imagery, not a specific product.
const TOP_CARDS = [
  {
    id: 'card-5',
    title: 'Custom Apparel',
    image: '/images/categories/custom-apparel-editorial.webp',
    url: '/search?category=Custom%20Apparel',
  },
  {
    id: 'card-1',
    title: 'Gourmet & Indian Food',
    image: '/images/categories/gourmet-indian-food.jpg',
    url: '/search?category=Gourmet%20%26%20Indian%20Food',
  },
  {
    id: 'card-2',
    title: 'Tech & Gadgets',
    image: '/images/categories/tech-gadgets.jpg',
    url: '/search?category=Tech%20%26%20Gadgets',
  },
  {
    id: 'card-3',
    title: 'Jewelry & Watches',
    image: '/images/categories/jewelry-watches.jpg',
    url: '/search?category=Jewelry%20%26%20Watches',
  },
  {
    id: 'card-4',
    title: 'Home & Lifestyle',
    image: '/images/categories/home-lifestyle.jpg',
    url: '/search?category=Home%20%26%20Lifestyle',
  },

  {
    id: 'card-6',
    title: 'Toys & Games',
    image: '/images/categories/toys-games.jpg',
    url: '/search?category=Toys%20%26%20Games',
  },
];

export default function TopCategoryCards() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section aria-label='Explore departments' className='relative w-full max-w-[1520px] mx-auto pt-3 pb-2 px-3 sm:px-4 md:px-6 font-sans group'>
      <div className='flex items-baseline justify-between gap-3 mb-3'>
        <h1 className='text-xl md:text-2xl font-bold text-[#0F1111] dark:text-white'>Find your everyday style</h1>
        <Link href='#all-departments-heading' className='text-xs font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap'>All departments</Link>
      </div>
      {/* Left Paddle */}
      <button
        onClick={() => scroll('left')}
        className='absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-14 md:w-10 md:h-24 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-r border-y border-r border-[#d5d9d9] dark:border-neutral-700 shadow-[2px_0_6px_rgba(0,0,0,0.18)] flex items-center justify-center transition focus:outline-none'
        aria-label='Previous'
      >
        <ChevronLeft className='w-4 h-4 md:w-6 md:h-6 text-[#0F1111] dark:text-white' />
      </button>

      {/* Horizontal Cards Track */}
      <div
        ref={scrollRef}
        className='flex items-stretch gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-1'
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TOP_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.url}
            className='flex flex-col justify-between shrink-0 w-[240px] sm:w-[260px] md:w-[275px] lg:w-[285px] bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] hover:shadow-md p-4 transition-all duration-150 cursor-pointer group/card'
          >
            <div>
              <h2 className='text-[18px] sm:text-[20px] font-bold text-[#0F1111] dark:text-white leading-[24px] mb-3 line-clamp-2 tracking-tight group-hover/card:text-[#c7511f] transition-colors'>
                {card.title}
              </h2>
            </div>
            <div className='relative w-full h-[280px] sm:h-[300px] md:h-[320px] overflow-hidden bg-neutral-100 dark:bg-neutral-800'>
              <ProductImage
                src={card.image}
                alt={`${card.title} - illustrative category artwork`}
                sizes='(max-width: 768px) 260px, 285px'
                className='object-cover group-hover/card:scale-102 transition-transform duration-300'
                priority
              />
            </div>
          </Link>
        ))}
      </div>
      <p className='text-[11px] text-neutral-600 dark:text-neutral-400 mt-2'>Category artwork is illustrative. Browse each department for current items.</p>

      {/* Right Paddle */}
      <button
        onClick={() => scroll('right')}
        className='absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-14 md:w-10 md:h-24 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-l border-y border-l border-[#d5d9d9] dark:border-neutral-700 shadow-[-2px_0_6px_rgba(0,0,0,0.18)] flex items-center justify-center transition focus:outline-none'
        aria-label='Next'
      >
        <ChevronRight className='w-4 h-4 md:w-6 md:h-6 text-[#0F1111] dark:text-white' />
      </button>
    </section>
  );
}
