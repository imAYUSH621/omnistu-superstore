'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AMAZON_GATEWAY_QUADS, GatewayQuad } from '@/lib/constants/amazon-gateway-quads';
import DepartmentRibbon from './department-ribbon';

function QuadCard({ quad }: { quad: GatewayQuad }) {
  return (
    <div className='bg-white dark:bg-[#1a202c] shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 p-4 md:p-5 flex flex-col justify-between transition-shadow hover:shadow-lg'>
      <div>
        <h2 className='text-[18px] md:text-[21px] font-bold text-[#0f1111] dark:text-white leading-snug mb-3 line-clamp-2'>
          {quad.title}
        </h2>

        {/* 2x2 Image Grid */}
        <div className='grid grid-cols-2 gap-2.5 sm:gap-3 mb-2'>
          {quad.items.map((item, idx) => (
            <Link
              key={idx}
              href={item.url}
              className='group block cursor-pointer'
            >
              <div className='aspect-square relative w-full overflow-hidden bg-[#f7f7f7] dark:bg-neutral-800 rounded-sm mb-1'>
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw'
                  className='object-cover group-hover:scale-105 transition-transform duration-200'
                />
              </div>
              <span className='text-[12px] text-[#0f1111] dark:text-neutral-300 line-clamp-1 group-hover:text-[#c7511f] dark:group-hover:text-amber-400 font-normal leading-tight'>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom See More Link */}
      <Link
        href={quad.ctaUrl}
        className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-medium pt-2 block'
      >
        {quad.ctaText}
      </Link>
    </div>
  );
}

export default function CategoryQuads() {
  const atfQuads = AMAZON_GATEWAY_QUADS.slice(0, 4);
  const midQuads = AMAZON_GATEWAY_QUADS.slice(4, 8);
  const btfQuadsRow1 = AMAZON_GATEWAY_QUADS.slice(8, 16);
  const btfQuadsRow2 = AMAZON_GATEWAY_QUADS.slice(16, 26);

  return (
    <div className='relative z-20 px-4 md:px-6 max-w-[1520px] mx-auto space-y-6'>
      {/* 1. Above The Fold (ATF): Overlaps Hero Carousel by ~220px on desktop */}
      <div className='-mt-24 sm:-mt-36 md:-mt-56 lg:-mt-72 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {atfQuads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 2. Middle Gateway Quads (4 Quads) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pt-1'>
        {midQuads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 3. Amazon Category & Department Discovery Ribbon */}
      <DepartmentRibbon />

      {/* 4. Below The Fold (BTF) Quads Set 1 (8 Quads) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pt-1'>
        {btfQuadsRow1.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 5. Below The Fold (BTF) Quads Set 2 (Remaining 10 Quads) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pt-1'>
        {btfQuadsRow2.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>
    </div>
  );
}
