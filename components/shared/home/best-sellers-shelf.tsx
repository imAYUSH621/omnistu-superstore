'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Check } from 'lucide-react';

export interface BestSellerProduct {
  id: string;
  rank: number;
  name: string;
  slug: string;
  category: string;
  price: string;
  rating: number;
  numReviews: number;
  image: string;
}

const BEST_SELLERS_DATA: BestSellerProduct[] = [
  // Toys & Games
  {
    id: 'bs-1',
    rank: 1,
    name: 'Silicone Magnetic Balls Fidget Toys for Adults & Teens',
    slug: 'silicone-magnetic-balls-fidget-toys',
    category: 'Toys & Games',
    price: '$12.99',
    rating: 4.8,
    numReviews: 2240,
    image: '/images/products/silicone-magnetic-balls-1.svg',
  },
  {
    id: 'bs-2',
    rank: 2,
    name: 'Magnetic Pen Fidget Decompression Toy with Stylus Tips',
    slug: 'magnetic-pen-fidget-decompression-toy',
    category: 'Toys & Games',
    price: '$18.95',
    rating: 4.7,
    numReviews: 1480,
    image: '/images/products/magnetic-pen-1.svg',
  },
  {
    id: 'bs-3',
    rank: 3,
    name: 'Anti-Gravity Levitating Magnetic Floating Desk Globe',
    slug: 'anti-gravity-levitating-magnetic-floating-desk-globe',
    category: 'Toys & Games',
    price: '$42.50',
    rating: 4.6,
    numReviews: 740,
    image: '/images/products/levitating-globe-1.svg',
  },
  // Apparel & Merch
  {
    id: 'bs-4',
    rank: 1,
    name: 'Omnistu Cyber Heavyweight Graphic Hoodie (300DPI Printify)',
    slug: 'omnistu-cyber-heavyweight-graphic-hoodie',
    category: 'Apparel & Merch',
    price: '$58.95',
    rating: 4.9,
    numReviews: 432,
    image: '/images/sample-products/p1-1.jpg',
  },
  {
    id: 'bs-5',
    rank: 2,
    name: 'Omnistu Vintage Wash Streetwear Oversized Tee (280GSM)',
    slug: 'omnistu-vintage-wash-streetwear-oversized-tee',
    category: 'Apparel & Merch',
    price: '$34.95',
    rating: 4.8,
    numReviews: 610,
    image: '/images/sample-products/p2-1.jpg',
  },
  {
    id: 'bs-6',
    rank: 3,
    name: 'Polo Sporting Athletic Stretch Shirt',
    slug: 'polo-sporting-stretch-shirt',
    category: 'Apparel & Merch',
    price: '$45.00',
    rating: 4.7,
    numReviews: 290,
    image: '/images/sample-products/p3-1.jpg',
  },
  // Electronics & Gadgets
  {
    id: 'bs-7',
    rank: 1,
    name: 'Active Noise-Cancelling Wireless Earbuds Pro (45dB ANC)',
    slug: 'active-noise-cancelling-wireless-earbuds-pro',
    category: 'Electronics & Gadgets',
    price: '$49.99',
    rating: 4.7,
    numReviews: 3120,
    image: '/images/products/anc-earbuds-1.svg',
  },
  {
    id: 'bs-8',
    rank: 2,
    name: 'MagSafe Fast Wireless Magnetic Power Bank 10000mAh',
    slug: 'magsafe-fast-wireless-magnetic-power-bank',
    category: 'Electronics & Gadgets',
    price: '$39.95',
    rating: 4.6,
    numReviews: 890,
    image: '/images/products/magsafe-powerbank-1.svg',
  },
  {
    id: 'bs-9',
    rank: 3,
    name: 'RGB High-Speed Fast Sync Data Charging Cable',
    slug: 'rgb-high-speed-fast-sync-cable',
    category: 'Electronics & Gadgets',
    price: '$14.99',
    rating: 4.8,
    numReviews: 1250,
    image: '/images/products/rgb-cable-1.svg',
  },
  // Home & Kitchen
  {
    id: 'bs-10',
    rank: 1,
    name: 'Smart Gravity Induction Constant Temp Coffee Mug Warmer',
    slug: 'smart-gravity-induction-coffee-mug-warmer',
    category: 'Home & Kitchen',
    price: '$24.99',
    rating: 4.8,
    numReviews: 1670,
    image: '/images/products/smart-mug-warmer-1.svg',
  },
  {
    id: 'bs-11',
    rank: 2,
    name: 'Handcrafted Ultrasonic Aroma Diffuser with Flame Light Effect',
    slug: 'handcrafted-ultrasonic-aroma-diffuser-flame-light',
    category: 'Home & Kitchen',
    price: '$29.99',
    rating: 4.7,
    numReviews: 1840,
    image: '/images/products/flame-diffuser-1.svg',
  },
];

const CATEGORIES = [
  'All Best Sellers',
  'Toys & Games',
  'Apparel & Merch',
  'Electronics & Gadgets',
  'Home & Kitchen',
];

export default function BestSellersShelf() {
  const [activeCategory, setActiveCategory] = useState('All Best Sellers');

  const filteredProducts =
    activeCategory === 'All Best Sellers'
      ? BEST_SELLERS_DATA
      : BEST_SELLERS_DATA.filter((p) => p.category === activeCategory);

  return (
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 my-6'>
      <div className='bg-white dark:bg-[#1a202c] p-5 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none'>
        {/* Header & Category Switcher Tabs */}
        <div className='border-b border-[#e7e7e7] dark:border-neutral-800 pb-3 mb-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-[20px] md:text-[22px] font-bold text-[#0f1111] dark:text-white tracking-tight'>
                  Amazon Top 100 Best Sellers
                </h2>
                <span className='bg-[#ff9900] text-black text-[11px] font-extrabold px-1.5 py-0.5 rounded-[2px] uppercase'>
                  Live Verified
                </span>
              </div>
              <p className='text-[13px] text-[#565959] dark:text-neutral-400 mt-0.5'>
                Our most popular products based on sales. Updated hourly.
              </p>
            </div>

            <Link
              href='/bestsellers/toys-and-games'
              className='text-[13px] text-[#007185] dark:text-[#56b6c2] hover:text-[#c7511f] hover:underline font-medium'
            >
              See complete leaderboard &rarr;
            </Link>
          </div>

          {/* Interactive Category Selector Tabs */}
          <div className='flex items-center gap-2 overflow-x-auto pt-3 scrollbar-none'>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-[13px] rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#131921] text-white shadow-sm'
                    : 'bg-[#f7f7f7] dark:bg-neutral-800 text-[#0f1111] dark:text-neutral-300 hover:bg-[#e7e7e7] dark:hover:bg-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
          {filteredProducts.map((p, idx) => (
            <div
              key={p.id}
              className='group flex flex-col justify-between border border-[#e7e7e7] dark:border-neutral-800/80 p-3 bg-white dark:bg-[#1a202c] rounded-sm hover:shadow-md transition relative'
            >
              {/* Rank Badge */}
              <div className='absolute top-2 left-2 z-10'>
                <span className='bg-[#e67a00] text-white text-[11px] font-black px-1.5 py-0.5 rounded-[2px] shadow-sm'>
                  #{idx + 1}
                </span>
              </div>

              {/* Product Image */}
              <Link href={`/product/${p.slug}`} className='block mb-2'>
                <div className='aspect-square relative w-full overflow-hidden bg-[#fafafa] dark:bg-neutral-800/50 p-2'>
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw'
                    className='object-contain p-2 group-hover:scale-105 transition-transform duration-200'
                  />
                </div>
              </Link>

              {/* Details */}
              <div className='flex flex-col flex-1 justify-between'>
                <div>
                  <Link
                    href={`/product/${p.slug}`}
                    className='text-[13px] text-[#0f1111] dark:text-neutral-200 hover:text-[#c7511f] line-clamp-2 font-normal leading-tight mb-1.5'
                  >
                    {p.name}
                  </Link>

                  {/* Star Rating */}
                  <div className='flex items-center gap-1 mb-1.5'>
                    <div className='flex text-[#de7921]'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className='w-3 h-3 fill-current stroke-current'
                        />
                      ))}
                    </div>
                    <span className='text-[11px] text-[#007185] dark:text-[#56b6c2]'>
                      {p.numReviews.toLocaleString()}
                    </span>
                  </div>

                  {/* Price */}
                  <div className='text-[17px] font-bold text-[#0f1111] dark:text-white leading-none mb-1'>
                    {p.price}
                  </div>

                  {/* Prime Badge */}
                  <div className='flex items-center gap-1 text-[11px] text-[#565959] dark:text-neutral-400'>
                    <span className='text-[#00a8e1] font-extrabold flex items-center'>
                      <Check className='w-3 h-3 stroke-[3]' /> prime
                    </span>
                    <span>Tomorrow</span>
                  </div>
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const win = window as unknown as {
                        OmnistuStore?: {
                          addToCart: (item: {
                            asin: string;
                            title: string;
                            price: string | number;
                            image: string;
                            quantity: number;
                          }) => void;
                        };
                      };
                      if (win.OmnistuStore) {
                        win.OmnistuStore.addToCart({
                          asin: p.id,
                          title: p.name,
                          price: p.price,
                          image: p.image,
                          quantity: 1,
                        });
                      }
                    }
                  }}
                  className='mt-3 w-full py-1 text-[12px] font-medium bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] border border-[#fcd200] rounded-full text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,0.5)] transition cursor-pointer'
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
