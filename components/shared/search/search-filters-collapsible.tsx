'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{SEARCH_COPY}from '@/lib/search-language';

import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

// On phones the faceted sidebar used to occupy the entire first viewport,
// pushing actual products below the fold. Collapse it behind a toggle on
// <md; desktop keeps the always-visible sticky sidebar.
export default function SearchFiltersCollapsible({
  children,
}: {
  children: React.ReactNode;
}) {
  const language=useStoreLanguage();const t=SEARCH_COPY[language];
  const [open, setOpen] = useState(false);
  return (
    <div className='w-full md:w-60 lg:w-64 flex-shrink-0 md:sticky md:top-20'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls='search-filters-panel'
        className='md:hidden flex items-center justify-between w-full h-10 px-4 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-card text-sm font-medium text-foreground'
      >
        <span className='flex items-center gap-2'>
          <SlidersHorizontal className='w-4 h-4' />
          {t.filters}
        </span>
        {open ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
      </button>
      <div
        id='search-filters-panel'
        className={`${open ? 'block' : 'hidden'} md:block mt-3 md:mt-0`}
      >
        {children}
      </div>
    </div>
  );
}
