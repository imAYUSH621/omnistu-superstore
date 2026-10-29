import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Check } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon Best Sellers: Top 100 Leaderboard | Omnistu Superstore',
  description: 'Our most popular products based on sales. Updated hourly.',
};

const CATEGORY_NAMES: Record<string, string> = {
  'toys-and-games': 'Toys & Games',
  'apparel': 'Apparel & Merch',
  'electronics': 'Electronics & Gadgets',
  'home': 'Home & Kitchen',
};

const LEADERBOARD_ITEMS = [
  {
    rank: 1,
    name: 'Silicone Magnetic Balls Fidget Toys for Adults & Teens (4-Pack)',
    slug: 'silicone-magnetic-balls-fidget-toys',
    category: 'Toys & Games',
    catSlug: 'toys-and-games',
    price: '$12.99',
    rating: 4.8,
    reviews: 2240,
    image: '/images/products/silicone-magnetic-balls-1.svg',
  },
  {
    rank: 2,
    name: 'Omnistu Cyber Heavyweight Graphic Hoodie (300DPI Printify)',
    slug: 'omnistu-cyber-heavyweight-graphic-hoodie',
    category: 'Apparel & Merch',
    catSlug: 'apparel',
    price: '$58.95',
    rating: 4.9,
    reviews: 432,
    image: '/images/sample-products/p1-1.jpg',
  },
  {
    rank: 3,
    name: 'Active Noise-Cancelling Wireless Earbuds Pro (45dB ANC)',
    slug: 'active-noise-cancelling-wireless-earbuds-pro',
    category: 'Electronics & Gadgets',
    catSlug: 'electronics',
    price: '$49.99',
    rating: 4.7,
    reviews: 3120,
    image: '/images/products/anc-earbuds-1.svg',
  },
  {
    rank: 4,
    name: 'Magnetic Pen Fidget Decompression Toy with Stylus Tips',
    slug: 'magnetic-pen-fidget-decompression-toy',
    category: 'Toys & Games',
    catSlug: 'toys-and-games',
    price: '$18.95',
    rating: 4.7,
    reviews: 1480,
    image: '/images/products/magnetic-pen-1.svg',
  },
  {
    rank: 5,
    name: 'Smart Gravity Induction Constant Temp Coffee Mug Warmer',
    slug: 'smart-gravity-induction-coffee-mug-warmer',
    category: 'Home & Kitchen',
    catSlug: 'home',
    price: '$24.99',
    rating: 4.8,
    reviews: 1670,
    image: '/images/products/smart-mug-warmer-1.svg',
  },
  {
    rank: 6,
    name: 'MagSafe Fast Wireless Magnetic Power Bank 10000mAh',
    slug: 'magsafe-fast-wireless-magnetic-power-bank',
    category: 'Electronics & Gadgets',
    catSlug: 'electronics',
    price: '$39.95',
    rating: 4.6,
    reviews: 890,
    image: '/images/products/magsafe-powerbank-1.svg',
  },
  {
    rank: 7,
    name: 'Omnistu Vintage Wash Streetwear Oversized Tee (280GSM)',
    slug: 'omnistu-vintage-wash-streetwear-oversized-tee',
    category: 'Apparel & Merch',
    catSlug: 'apparel',
    price: '$34.95',
    rating: 4.8,
    reviews: 610,
    image: '/images/sample-products/p2-1.jpg',
  },
  {
    rank: 8,
    name: 'Anti-Gravity Levitating Magnetic Floating Desk Globe',
    slug: 'anti-gravity-levitating-magnetic-floating-desk-globe',
    category: 'Toys & Games',
    catSlug: 'toys-and-games',
    price: '$42.50',
    rating: 4.6,
    reviews: 740,
    image: '/images/products/levitating-globe-1.svg',
  },
  {
    rank: 9,
    name: 'Handcrafted Ultrasonic Aroma Diffuser with Flame Light Effect',
    slug: 'handcrafted-ultrasonic-aroma-diffuser-flame-light',
    category: 'Home & Kitchen',
    catSlug: 'home',
    price: '$29.99',
    rating: 4.7,
    reviews: 1840,
    image: '/images/products/flame-diffuser-1.svg',
  },
];

export default async function BestSellersCategoryPage(props: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await props.params;
  const currentCatName = CATEGORY_NAMES[category] || 'All Departments';

  const items =
    category === 'all' || !CATEGORY_NAMES[category]
      ? LEADERBOARD_ITEMS
      : LEADERBOARD_ITEMS.filter((i) => i.catSlug === category);

  return (
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 py-6 font-["Amazon_Ember",Arial,sans-serif]'>
      {/* Breadcrumb Header */}
      <div className='border-b border-[#e7e7e7] dark:border-neutral-800 pb-4 mb-6'>
        <h1 className='text-2xl md:text-3xl font-bold text-[#0f1111] dark:text-white'>
          Amazon Best Sellers
        </h1>
        <p className='text-[13px] text-[#565959] dark:text-neutral-400 mt-1'>
          Our most popular products based on sales. Updated hourly.
        </p>
      </div>

      <div className='flex flex-col md:flex-row gap-8 items-start'>
        {/* Left Category Navigation */}
        <div className='w-full md:w-56 flex-shrink-0 bg-white dark:bg-[#1a202c] p-4 border border-[#e7e7e7] dark:border-neutral-800 rounded-sm shadow-xs'>
          <h3 className='font-bold text-[14px] text-[#0f1111] dark:text-white mb-2'>
            Any Department
          </h3>
          <ul className='space-y-1.5 text-[13px]'>
            <li>
              <Link
                href='/bestsellers/toys-and-games'
                className={`block py-1 px-2 rounded hover:text-[#c7511f] ${
                  category === 'toys-and-games'
                    ? 'font-bold text-[#c7511f] bg-neutral-100 dark:bg-neutral-800'
                    : 'text-[#007185] dark:text-[#56b6c2]'
                }`}
              >
                Toys & Games
              </Link>
            </li>
            <li>
              <Link
                href='/bestsellers/apparel'
                className={`block py-1 px-2 rounded hover:text-[#c7511f] ${
                  category === 'apparel'
                    ? 'font-bold text-[#c7511f] bg-neutral-100 dark:bg-neutral-800'
                    : 'text-[#007185] dark:text-[#56b6c2]'
                }`}
              >
                Apparel & Merch
              </Link>
            </li>
            <li>
              <Link
                href='/bestsellers/electronics'
                className={`block py-1 px-2 rounded hover:text-[#c7511f] ${
                  category === 'electronics'
                    ? 'font-bold text-[#c7511f] bg-neutral-100 dark:bg-neutral-800'
                    : 'text-[#007185] dark:text-[#56b6c2]'
                }`}
              >
                Electronics & Gadgets
              </Link>
            </li>
            <li>
              <Link
                href='/bestsellers/home'
                className={`block py-1 px-2 rounded hover:text-[#c7511f] ${
                  category === 'home'
                    ? 'font-bold text-[#c7511f] bg-neutral-100 dark:bg-neutral-800'
                    : 'text-[#007185] dark:text-[#56b6c2]'
                }`}
              >
                Home & Kitchen
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Leaderboard Grid */}
        <div className='flex-1 w-full bg-white dark:bg-[#1a202c] p-6 border border-[#e7e7e7] dark:border-neutral-800 rounded-sm shadow-xs'>
          <div className='flex items-center justify-between border-b border-[#e7e7e7] dark:border-neutral-800 pb-3 mb-6'>
            <h2 className='text-lg font-bold text-[#0f1111] dark:text-white'>
              Best Sellers in {currentCatName}
            </h2>
            <span className='text-xs text-[#565959] dark:text-neutral-400'>
              Showing 1 - {items.length} of {items.length}
            </span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {items.map((item, idx) => (
              <div
                key={item.slug}
                className='border border-[#e7e7e7] dark:border-neutral-800/80 p-4 rounded-sm flex flex-col justify-between hover:shadow-md transition relative bg-white dark:bg-[#1a202c]'
              >
                {/* Large Rank Banner */}
                <div className='absolute top-3 left-3 z-10'>
                  <span className='bg-[#e67a00] text-white text-xs font-black px-2 py-0.5 rounded-[2px] shadow-sm'>
                    #{idx + 1}
                  </span>
                </div>

                {/* Product Image */}
                <Link href={`/product/${item.slug}`} className='block my-4'>
                  <div className='aspect-square relative w-full overflow-hidden bg-[#fafafa] dark:bg-neutral-800/50 p-2'>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                      className='object-contain p-2 hover:scale-105 transition-transform duration-200'
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className='flex flex-col flex-1 justify-between'>
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className='text-[14px] text-[#0f1111] dark:text-neutral-200 hover:text-[#c7511f] font-normal line-clamp-2 leading-snug mb-1.5'
                    >
                      {item.name}
                    </Link>

                    {/* Star Rating */}
                    <div className='flex items-center gap-1.5 mb-2'>
                      <div className='flex text-[#de7921]'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className='w-3.5 h-3.5 fill-current stroke-current'
                          />
                        ))}
                      </div>
                      <span className='text-xs text-[#007185] dark:text-[#56b6c2]'>
                        {item.reviews.toLocaleString()}
                      </span>
                    </div>

                    {/* Price */}
                    <div className='text-lg font-bold text-[#0f1111] dark:text-white mb-1'>
                      {item.price}
                    </div>

                    {/* Prime badge */}
                    <div className='flex items-center gap-1 text-xs text-[#565959] dark:text-neutral-400'>
                      <span className='text-[#00a8e1] font-extrabold flex items-center'>
                        <Check className='w-3 h-3 stroke-[3]' /> prime
                      </span>
                      <span>Tomorrow</span>
                    </div>
                  </div>

                  <Link
                    href={`/product/${item.slug}`}
                    className='mt-4 block w-full py-1.5 text-center text-xs font-bold bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] border border-[#fcd200] rounded-full text-[#0f1111] shadow-[0_2px_5px_rgba(213,217,217,0.5)] transition'
                  >
                    View Details & Buy Box
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
