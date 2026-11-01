'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Flame, ArrowRight } from 'lucide-react';

interface DealsCarouselStripProps {
  deals: Product[];
}

export default function DealsCarouselStrip({ deals }: DealsCarouselStripProps) {
  if (!deals || deals.length === 0) return null;

  return (
    <div className='my-6 p-4 rounded-xl border border-amber-200 dark:border-amber-950 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent'>
      {/* Header */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <span className='w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm'>
            <Flame className='w-4 h-4 fill-white' />
          </span>
          <div>
            <h2 className='text-sm sm:text-base font-bold text-foreground flex items-center gap-2'>
              Featured in Omnistu Superstore
            </h2>
          </div>
        </div>
        <Link
          href='/search?q=all'
          className='text-xs font-semibold text-primary hover:underline flex items-center gap-1'
        >
          <span>See all products</span>
          <ArrowRight className='w-3 h-3' />
        </Link>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className='flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin no-scrollbar'>
        {deals.map((deal) => {
          const priceNum = Number(deal.price);

          return (
            <Link
              key={deal.id}
              href={`/product/${deal.slug}`}
              className='w-48 flex-shrink-0 bg-card rounded-lg p-3 border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition flex flex-col justify-between group'
            >
              <div className='relative w-full h-32 bg-neutral-50 dark:bg-neutral-900 rounded-md overflow-hidden p-2 flex items-center justify-center mb-2'>
                <Image
                  src={deal.images[0] || '/images/products/placeholder.svg'}
                  alt={deal.name}
                  fill
                  sizes='192px'
                  className='object-contain group-hover:scale-105 transition-transform duration-300'
                />
              </div>

              <div className='space-y-1.5'>

                <div className='flex items-baseline gap-1'>
                  <span className='text-sm font-bold text-foreground'>${priceNum.toFixed(2)}</span>
                </div>

                <p className='text-xs text-foreground font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                  {deal.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
