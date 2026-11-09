'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{SEARCH_COPY}from '@/lib/search-language';
import{homeDepartment}from '@/lib/home-language';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, DollarSign, Star, Tag } from 'lucide-react';

export default function SearchNarrowChips({ categories = [], facetCounts }: { facetCounts?: { price: Record<string, number>; rating: Record<string, number> }; categories?: { category: string; _count?: number | { _all?: number } }[] }) {
  const language=useStoreLanguage();const t=SEARCH_COPY[language];
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
      label: t.allProducts,
      icon: Sparkles,
      active: currentCategory === 'all' && currentPrice === 'all' && currentRating === 'all',
      href: '/search',
    },
    {
      label: t.under25,
      count: facetCounts?.price['0-25'],
      icon: DollarSign,
      active: currentPrice === '0-25',
      href: makeChipUrl({ price: currentPrice === '0-25' ? 'all' : '0-25' }),
    },
    {
      label: t.range25,
      count: facetCounts?.price['25-50'],
      icon: Tag,
      active: currentPrice === '25-50',
      href: makeChipUrl({ price: currentPrice === '25-50' ? 'all' : '25-50' }),
    },
    {
      label: '4★ '+t.andUp,
      count: facetCounts?.rating['4'],
      icon: Star,
      active: currentRating === '4',
      href: makeChipUrl({ rating: currentRating === '4' ? 'all' : '4' }),
    },
    // Category chips come from the categories that actually exist in the
    // current catalog, so a chip can never point at an empty category name.
    ...categories.slice(0, 6).map((c) => ({
      label: homeDepartment(c.category,language),
      icon: Tag,
      active: currentCategory === c.category,
      href: makeChipUrl({ category: currentCategory === c.category ? 'all' : c.category }),
    })),
  ];

  return (
    <div className='my-3 pb-2'>
      <div className='flex flex-wrap items-center gap-2 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider'>
        <Sparkles className='w-3.5 h-3.5 text-amber-500' />
        <span>{t.narrow}</span>
        <span data-testid='chip-price-note' className='normal-case font-normal tracking-normal'>
          {t.referenceNote}
        </span>
      </div>

      <div className='flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin no-scrollbar'>
        {chips.map((chip, idx) => {
          const Icon = chip.icon;
          const count = (chip as { count?: number }).count;
          if (count === 0 && !chip.active) {
            return (
              <span
                key={idx}
                data-testid='chip-empty'
                aria-disabled='true'
                className='inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border whitespace-nowrap font-medium border-neutral-200 dark:border-neutral-800 text-muted-foreground/60 bg-neutral-50 dark:bg-neutral-900'
              >
                <Icon className='w-3.5 h-3.5 text-neutral-400' />
                <span>{chip.label} (0)</span>
              </span>
            );
          }
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
              <span>{chip.label}{count !== undefined ? ` (${count})` : ''}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
