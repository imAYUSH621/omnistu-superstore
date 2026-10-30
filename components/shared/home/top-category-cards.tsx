'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOP_CARDS = [
  {
    id: 'card-1',
    title: 'Shop kitchen must-haves',
    image: '/assets/images/card_kitchen_must_haves.jpg',
    url: '/s?k=kitchen%20must-haves',
  },
  {
    id: 'card-2',
    title: 'Shop all things beauty',
    image: '/assets/images/card_beauty_all_things.jpg',
    url: '/s?k=beauty',
  },
  {
    id: 'card-3',
    title: 'Start looking sharp',
    image: '/assets/images/card_looking_sharp.jpg',
    url: '/s?k=fashion%20clothing',
  },
  {
    id: 'card-4',
    title: 'Toys for little ones',
    image: '/assets/images/card_toys_little_ones.jpg',
    url: '/s?k=toys',
  },
  {
    id: 'card-5',
    title: 'Level up your PC here',
    image: '/assets/images/card_level_up_pc.jpg',
    url: '/s?k=computers',
  },
  {
    id: 'card-6',
    title: 'Discover books you can\'t put down',
    image: '/assets/images/card_books_cant_put_down.jpg',
    url: '/s?k=books',
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
    <div className='relative w-full max-w-[1520px] mx-auto pt-3 pb-2 px-3 sm:px-4 md:px-6 font-["Amazon_Ember",Arial,sans-serif] group'>
      {/* Left Paddle */}
      <button
        onClick={() => scroll('left')}
        className='absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-r border-y border-r border-[#d5d9d9] dark:border-neutral-700 shadow-[2px_0_6px_rgba(0,0,0,0.18)] flex items-center justify-center transition focus:outline-none'
        aria-label='Previous'
      >
        <ChevronLeft className='w-6 h-6 text-[#0F1111] dark:text-white' />
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
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes='(max-width: 768px) 260px, 285px'
                className='object-cover group-hover/card:scale-102 transition-transform duration-300'
                priority
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Right Paddle */}
      <button
        onClick={() => scroll('right')}
        className='absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-white/95 hover:bg-white active:bg-[#f3f3f3] dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-l border-y border-l border-[#d5d9d9] dark:border-neutral-700 shadow-[-2px_0_6px_rgba(0,0,0,0.18)] flex items-center justify-center transition focus:outline-none'
        aria-label='Next'
      >
        <ChevronRight className='w-6 h-6 text-[#0F1111] dark:text-white' />
      </button>
    </div>
  );
}
