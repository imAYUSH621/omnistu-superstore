'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FacetedSidebarProps {
  categories: { category: string; _count: number }[];
  currentCategory: string;
  currentPrice: string;
  currentRating: string;
  currentSort: string;
  currentQ: string;
}

export default function SearchFacetedSidebar({
  categories,
  currentCategory,
  currentPrice,
  currentRating,
  currentSort,
  currentQ,
}: FacetedSidebarProps) {
  const router = useRouter();
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    if (currentQ && currentQ !== 'all') params.set('q', currentQ);
    if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
    if (currentPrice && currentPrice !== 'all') params.set('price', currentPrice);
    if (currentRating && currentRating !== 'all') params.set('rating', currentRating);
    if (currentSort && currentSort !== 'newest') params.set('sort', currentSort);

    Object.entries(overrides).forEach(([k, v]) => {
      if (v === 'all' || !v) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });

    params.set('page', '1');
    const qs = params.toString();
    return qs ? `/search?${qs}` : '/search';
  };

  const handleCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = minPrice.trim() ? Number(minPrice) : 0;
    const max = maxPrice.trim() ? Number(maxPrice) : 1000;
    if (!isNaN(min) && !isNaN(max) && max >= min) {
      router.push(buildUrl({ price: `${min}-${max}` }));
    }
  };

  const isAnyFilterActive =
    (currentCategory && currentCategory !== 'all') ||
    (currentPrice && currentPrice !== 'all') ||
    (currentRating && currentRating !== 'all');

  const priceBuckets = [
    { label: 'Under $25', value: '1-25' },
    { label: '$25 to $50', value: '25-50' },
    { label: '$50 to $100', value: '50-100' },
    { label: '$100 to $500', value: '100-500' },
  ];

  const ratingOptions = [4, 3, 2, 1];

  return (
    <aside className='space-y-6 text-sm text-foreground select-none'>
      {/* Clear Filters Button */}
      {isAnyFilterActive && (
        <div className='p-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg flex items-center justify-between'>
          <span className='text-xs font-semibold text-neutral-600 dark:text-neutral-400'>
            Filters active
          </span>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='h-7 text-xs text-primary hover:underline px-2'
          >
            <Link href='/search' className='flex items-center gap-1'>
              <RotateCcw className='w-3 h-3' /> Clear all
            </Link>
          </Button>
        </div>
      )}

      {/* 1. Popular Shopping Ideas / Tags */}
      <div className='space-y-2.5'>
        <h3 className='font-bold text-sm text-foreground uppercase tracking-wide text-xs'>
          Popular Shopping Ideas
        </h3>
        <div className='flex flex-wrap gap-1.5'>
          {['Mini', 'Neodymium', '45dB ANC', 'MagSafe', '400GSM', '55°C', '100W PD'].map(
            (idea) => (
              <Link
                key={idea}
                href={buildUrl({ q: idea.toLowerCase() })}
                className='text-[11px] px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition'
              >
                {idea}
              </Link>
            )
          )}
        </div>
      </div>

      <hr className='border-neutral-200 dark:border-neutral-800' />

      {/* 2. Department / Categories */}
      <div className='space-y-2'>
        <h3 className='font-bold text-sm text-foreground'>Department</h3>
        <ul className='space-y-1 text-xs'>
          <li>
            <Link
              href={buildUrl({ category: 'all' })}
              className={`flex items-center justify-between py-1 px-1.5 rounded transition ${
                currentCategory === 'all' || !currentCategory
                  ? 'font-bold text-primary bg-primary/10'
                  : 'hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span>All Departments</span>
            </Link>
          </li>
          {categories.map((c) => {
            const isSelected = currentCategory === c.category;
            return (
              <li key={c.category}>
                <Link
                  href={buildUrl({ category: isSelected ? 'all' : c.category })}
                  className={`flex items-center justify-between py-1 px-1.5 rounded transition ${
                    isSelected
                      ? 'font-bold text-primary bg-primary/10'
                      : 'hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className='truncate'>{c.category}</span>
                  <span className='text-[11px] text-muted-foreground ml-1'>
                    ({c._count})
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className='border-neutral-200 dark:border-neutral-800' />

      {/* 3. Customer Reviews */}
      <div className='space-y-2'>
        <h3 className='font-bold text-sm text-foreground'>Customer Reviews</h3>
        <ul className='space-y-1.5 text-xs'>
          {ratingOptions.map((r) => {
            const isSelected = currentRating === r.toString();
            return (
              <li key={r}>
                <Link
                  href={buildUrl({ rating: isSelected ? 'all' : r.toString() })}
                  className={`flex items-center gap-2 py-1 px-1.5 rounded transition group ${
                    isSelected
                      ? 'font-bold text-primary bg-primary/10'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className='flex items-center text-amber-500'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-neutral-300 dark:text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className='text-xs'>& Up</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <hr className='border-neutral-200 dark:border-neutral-800' />

      {/* 4. Price & Deals */}
      <div className='space-y-2.5'>
        <h3 className='font-bold text-sm text-foreground'>Price</h3>
        <ul className='space-y-1 text-xs'>
          <li>
            <Link
              href={buildUrl({ price: 'all' })}
              className={`block py-1 px-1.5 rounded transition ${
                currentPrice === 'all' || !currentPrice
                  ? 'font-bold text-primary bg-primary/10'
                  : 'hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              All Prices
            </Link>
          </li>
          {priceBuckets.map((bucket) => {
            const isSelected = currentPrice === bucket.value;
            return (
              <li key={bucket.value}>
                <Link
                  href={buildUrl({ price: isSelected ? 'all' : bucket.value })}
                  className={`block py-1 px-1.5 rounded transition ${
                    isSelected
                      ? 'font-bold text-primary bg-primary/10'
                      : 'hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {bucket.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Custom Price Range Inputs */}
        <form onSubmit={handleCustomPriceSubmit} className='pt-2 flex items-center gap-1.5'>
          <div className='relative flex-1'>
            <span className='absolute left-2 top-2 text-xs text-muted-foreground'>$</span>
            <Input
              type='number'
              placeholder='Min'
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className='h-8 pl-5 text-xs'
              min='0'
            />
          </div>
          <span className='text-muted-foreground'>-</span>
          <div className='relative flex-1'>
            <span className='absolute left-2 top-2 text-xs text-muted-foreground'>$</span>
            <Input
              type='number'
              placeholder='Max'
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className='h-8 pl-5 text-xs'
              min='0'
            />
          </div>
          <Button
            type='submit'
            size='sm'
            variant='outline'
            className='h-8 px-2.5 text-xs font-semibold'
          >
            Go
          </Button>
        </form>
      </div>

      <hr className='border-neutral-200 dark:border-neutral-800' />

      {/* 5. Delivery & Fulfillment */}
      <div className='space-y-2'>
        <h3 className='font-bold text-sm text-foreground'>Delivery Day</h3>
        <div className='space-y-2 text-xs'>
          <label className='flex items-center gap-2 cursor-pointer hover:text-primary transition'>
            <input
              type='checkbox'
              checked={true}
              readOnly
              className='rounded text-primary focus:ring-primary w-3.5 h-3.5'
            />
            <span className='inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400'>
              <Zap className='w-3 h-3 fill-sky-500' /> Express Tomorrow
            </span>
          </label>
          <p className='text-[11px] text-muted-foreground pl-5'>
            Get free next-day dispatch on qualified items.
          </p>
        </div>
      </div>
    </aside>
  );
}
