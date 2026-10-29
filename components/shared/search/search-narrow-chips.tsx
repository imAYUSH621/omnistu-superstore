'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Zap, Flame, DollarSign, Star, Tag } from 'lucide-react';

export default function SearchNarrowChips() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentPrice = searchParams.get('price') || 'all';
  const currentRating = searchParams.get('rating') || 'all';

  const makeChipUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === 'all' || !v) {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    // Reset to page 1
    params.set('page', '1');
    return `/search?${params.toString()}`;
  };

  const chips = [
    {
      label: 'All Products',
      icon: Sparkles,
      active: currentCategory === 'all' && currentPrice === 'all' && currentRating === 'all',
      href: '/search',
    },
    {
      label: 'Under $25',
      icon: DollarSign,
      active: currentPrice === '1-25',
      href: makeChipUrl({ price: currentPrice === '1-25' ? 'all' : '1-25' }),
    },
    {
      label: '$25 to $50',
      icon: Tag,
      active: currentPrice === '25-50',
      href: makeChipUrl({ price: currentPrice === '25-50' ? 'all' : '25-50' }),
    },
    {
      label: '4★ & Above',
      icon: Star,
      active: currentRating === '4',
      href: makeChipUrl({ rating: currentRating === '4' ? 'all' : '4' }),
    },
    {
      label: 'Sensory & Toys',
      icon: Flame,
      active: currentCategory === 'Toys & Games',
      href: makeChipUrl({ category: currentCategory === 'Toys & Games' ? 'all' : 'Toys & Games' }),
    },
    {
      label: 'Electronics & Audio',
      icon: Zap,
      active: currentCategory === 'Electronics & Gadgets',
      href: makeChipUrl({ category: currentCategory === 'Electronics & Gadgets' ? 'all' : 'Electronics & Gadgets' }),
    },
    {
      label: 'Apparel & Streetwear',
      icon: Sparkles,
      active: currentCategory === 'Apparel & Merch',
      href: makeChipUrl({ category: currentCategory === 'Apparel & Merch' ? 'all' : 'Apparel & Merch' }),
    },
    {
      label: 'Home & Kitchen',
      icon: Tag,
      active: currentCategory === 'Home & Kitchen',
      href: makeChipUrl({ category: currentCategory === 'Home & Kitchen' ? 'all' : 'Home & Kitchen' }),
    },
  ];

  return (
    <div className='my-3 pb-2'>
      <div className='flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider'>
        <Sparkles className='w-3.5 h-3.5 text-amber-500' />
        <span>Narrow your search</span>
      </div>

      <div className='flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin no-scrollbar'>
        {chips.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <Link
              key={idx}
              href={chip.href}
              className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-all duration-150 font-medium ${
                chip.active
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm'
                  : 'bg-card text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${chip.active ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>{chip.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
