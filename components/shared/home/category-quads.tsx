'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AMAZON_GATEWAY_QUADS, GatewayQuad } from '@/lib/constants/amazon-gateway-quads';
import DepartmentShoveler from './department-shoveler';
import AmazonSignInBanner from './amazon-signin-banner';
import TrendingCollectionsShoveler from './trending-collections-shoveler';
import DepartmentRibbon from './department-ribbon';

function QuadCard({ quad }: { quad: GatewayQuad }) {
  return (
    <div className='bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] rounded-none p-5 flex flex-col justify-between transition-shadow hover:shadow-md font-["Amazon_Ember",Arial,sans-serif]'>
      <div>
        <h2 className='text-[21px] font-bold text-[#0F1111] dark:text-white leading-[27px] mb-3 line-clamp-2 tracking-tight'>
          {quad.title}
        </h2>

        {/* 2x2 Image Grid */}
        <div className='grid grid-cols-2 gap-x-4 gap-y-3 mb-2'>
          {quad.items.map((item, idx) => (
            <Link
              key={idx}
              href={item.url}
              className='group block cursor-pointer text-left'
            >
              <div className='aspect-square relative w-full overflow-hidden bg-white dark:bg-neutral-800 rounded-none mb-1.5'>
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw'
                  className='object-cover group-hover:scale-105 transition-transform duration-200'
                />
              </div>
              <span className='text-[12px] text-[#0F1111] dark:text-neutral-300 line-clamp-1 group-hover:text-[#c7511f] dark:group-hover:text-amber-400 font-normal leading-[16px] block'>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom See More Link */}
      <Link
        href={quad.ctaUrl}
        className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-normal pt-3 block'
      >
        {quad.ctaText}
      </Link>
    </div>
  );
}

export default function CategoryQuads() {
  const row1Quads = AMAZON_GATEWAY_QUADS.slice(0, 4);   // ATF Overlapping Hero (0-3)
  const row2Quads = AMAZON_GATEWAY_QUADS.slice(4, 8);   // Gateway Row 2 (4-7)
  const row3Quads = AMAZON_GATEWAY_QUADS.slice(8, 12);  // Gateway Row 3 (8-11)
  const row4Quads = AMAZON_GATEWAY_QUADS.slice(12, 16); // Gateway Row 4 (12-15)
  const row5Quads = AMAZON_GATEWAY_QUADS.slice(16, 20); // Gateway Row 5 (16-19)
  const row6Quads = AMAZON_GATEWAY_QUADS.slice(20, 26); // Gateway Row 6 (20-25: 6 Quads)

  return (
    <div className='relative z-20 px-3 sm:px-4 md:px-6 max-w-[1520px] mx-auto space-y-5 sm:space-y-6'>
      {/* 1. Row 1: Above The Fold (ATF) - Overlaps Hero Carousel by ~220px on desktop */}
      <div className='-mt-24 sm:-mt-36 md:-mt-52 lg:-mt-72 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {row1Quads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 2. Row 2: Middle Gateway Quads (4 Quads) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {row2Quads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 3. Horizontal Category Shoveler: Explore Popular Departments */}
      <DepartmentShoveler />

      {/* 4. Row 3: 4 Category Quads (Fashion Trends, Home Harmony, Shoes, Furry Friends) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {row3Quads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 5. Amazon Personalized Recommendations Sign-in Strip */}
      <AmazonSignInBanner />

      {/* 6. Row 4: 4 Category Quads (Video Games, Family Fun, Finds in Home, Deals) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {row4Quads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 7. Trending Deals & Department Spotlights Carousel Shelf */}
      <TrendingCollectionsShoveler />

      {/* 8. Row 5: 4 Category Quads (New Home Arrivals, Latest Arrivals, Accessorize, Step into Style) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5'>
        {row5Quads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>

      {/* 9. Department Discovery Grid Ribbon */}
      <DepartmentRibbon />

      {/* 10. Row 6: Final 6 Quads (Beauty Routine, Home Theater, Space, Season, Build PC, Books) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5'>
        {row6Quads.map((quad) => (
          <QuadCard key={quad.id} quad={quad} />
        ))}
      </div>
    </div>
  );
}
