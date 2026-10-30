'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AMAZON_GATEWAY_QUADS, GatewayQuad } from '@/lib/constants/amazon-gateway-quads';
import { ChevronRight } from 'lucide-react';

function QuadCard({ quad }: { quad: GatewayQuad }) {
  return (
    <div className='bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] rounded-none p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow font-["Amazon_Ember",Arial,sans-serif]'>
      <div>
        {/* Amazon Header with Right Chevron */}
        <Link
          href={quad.ctaUrl}
          className='group/title flex items-center justify-between gap-1 mb-3 text-left'
        >
          <h2 className='text-[18px] sm:text-[20px] font-bold text-[#0F1111] dark:text-white leading-[24px] tracking-tight group-hover/title:text-[#c7511f] transition-colors line-clamp-1'>
            {quad.title}
          </h2>
          <ChevronRight className='w-4 h-4 text-[#0F1111] dark:text-white group-hover/title:text-[#c7511f] transition-colors shrink-0' />
        </Link>

        {/* 2x2 Image Grid with 12px Labels */}
        <div className='grid grid-cols-2 gap-x-3.5 gap-y-3'>
          {quad.items.map((item, idx) => (
            <Link
              key={idx}
              href={item.url}
              className='group/item block cursor-pointer text-left'
            >
              <div className='aspect-square relative w-full overflow-hidden bg-white dark:bg-neutral-800 rounded-none mb-1'>
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  sizes='(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw'
                  className='object-cover group-hover/item:scale-103 transition-transform duration-200'
                />
              </div>
              <span className='text-[12px] text-[#0F1111] dark:text-neutral-300 line-clamp-1 group-hover/item:text-[#c7511f] dark:group-hover/item:text-amber-400 font-normal leading-[16px] block'>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoryQuads() {
  return (
    <div className='relative z-20 px-3 sm:px-4 md:px-6 max-w-[1520px] mx-auto pt-2 pb-12 font-["Amazon_Ember",Arial,sans-serif]'>
      {/* Continuous 4-Column Category Grid Matching Authentic Amazon (26 Quads) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {AMAZON_GATEWAY_QUADS.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>
    </div>
  );
}
