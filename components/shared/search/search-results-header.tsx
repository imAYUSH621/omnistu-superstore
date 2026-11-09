'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{searchResultsCount,SEARCH_COPY}from '@/lib/search-language';
import{homeDepartment}from '@/lib/home-language';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List, X } from 'lucide-react';

interface SearchResultsHeaderProps {
  totalResults: number;
  page?: number;
  pageSize?: number;
  currentQ: string;
  currentCategory: string;
  currentPrice: string;
  currentRating: string;
  currentSort: string;
  viewMode: 'grid' | 'list';
  onViewChange: (mode: 'grid' | 'list') => void;
}

// Headline for the results strip. With zero results "Showing 1-0 of 0" is
// nonsense - say so plainly instead.
export {searchResultsCount as formatResultsCount} from '@/lib/search-language';

export default function SearchResultsHeader({
  totalResults,
  page = 1,
  pageSize = 24,
  currentQ,
  currentCategory,
  currentPrice,
  currentRating,
  currentSort,
  viewMode,
  onViewChange,
}: SearchResultsHeaderProps) {
  const language=useStoreLanguage();const t=SEARCH_COPY[language];
  const router = useRouter();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams();
    if (currentQ && currentQ !== 'all') params.set('q', currentQ);
    if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
    if (currentPrice && currentPrice !== 'all') params.set('price', currentPrice);
    if (currentRating && currentRating !== 'all') params.set('rating', currentRating);
    if (newSort && newSort !== 'newest') params.set('sort', newSort);
    params.set('page', '1');
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  };

  const getDismissUrl = (keyToDismiss: string) => {
    const params = new URLSearchParams();
    if (currentQ && currentQ !== 'all' && keyToDismiss !== 'q') params.set('q', currentQ);
    if (currentCategory && currentCategory !== 'all' && keyToDismiss !== 'category')
      params.set('category', currentCategory);
    if (currentPrice && currentPrice !== 'all' && keyToDismiss !== 'price')
      params.set('price', currentPrice);
    if (currentRating && currentRating !== 'all' && keyToDismiss !== 'rating')
      params.set('rating', currentRating);
    if (currentSort && currentSort !== 'newest') params.set('sort', currentSort);
    params.set('page', '1');
    const qs = params.toString();
    return qs ? `/search?${qs}` : '/search';
  };

  return (
    <div className='border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-4 space-y-2'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        {/* Results Count Headline */}
        <div>
          <h1 className='text-sm sm:text-base text-foreground'>
            <span className='font-normal text-muted-foreground'>
              {searchResultsCount(totalResults,page,pageSize,language)}
            </span>{' '}
            {currentQ && currentQ !== 'all' && (
              <span>
                {t.forQuery} <span className='font-bold text-amber-600 dark:text-amber-400'>&ldquo;{currentQ}&rdquo;</span>
              </span>
            )}
          </h1>
        </div>

        {/* Controls: Sort Dropdown + Grid/List View Switcher */}
        <div className='min-w-0 flex flex-wrap items-center gap-3 self-end sm:self-auto'>
          {/* Sort Selector */}
          <div className='flex items-center gap-1.5 text-xs'>
            <span className='text-muted-foreground hidden sm:inline'>{t.sort}:</span>
            <select
              aria-label={t.sort}
              value={currentSort || 'newest'}
              onChange={(e) => handleSortChange(e.target.value)}
              className='max-w-[200px] h-8 px-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-card text-foreground text-xs font-medium focus:ring-1 focus:ring-primary outline-none cursor-pointer'
            >
              <option value='newest'>{t.newest}</option>
              <option value='lowest'>{t.lowest}</option>
              <option value='highest'>{t.highest}</option>
              <option value='rating'>{t.ratingSort}</option>
            </select>
          </div>

          {/* Grid vs List View Buttons */}
          <div className='flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg p-0.5 bg-neutral-100 dark:bg-neutral-800'>
            <button
              type='button'
              onClick={() => onViewChange('list')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t.list}
              aria-label={t.list}
            >
              <List className='w-4 h-4' />
            </button>
            <button
              type='button'
              onClick={() => onViewChange('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t.grid}
              aria-label={t.grid}
            >
              <LayoutGrid className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      <div className='flex items-center gap-1.5 flex-wrap pt-1'>
        {currentQ && currentQ !== 'all' && (
          <Link
            href={getDismissUrl('q')}
            className='inline-flex items-center gap-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700'
          >
            <span>&ldquo;{currentQ}&rdquo;</span>
            <X className='w-3 h-3 text-muted-foreground' />
          </Link>
        )}
        {currentCategory && currentCategory !== 'all' && (
          <Link
            href={getDismissUrl('category')}
            className='inline-flex items-center gap-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700'
          >
            <span>{homeDepartment(currentCategory,language)}</span>
            <X className='w-3 h-3 text-muted-foreground' />
          </Link>
        )}
        {currentPrice && currentPrice !== 'all' && (
          <Link
            href={getDismissUrl('price')}
            className='inline-flex items-center gap-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700'
          >
            <span>{t.price}: {currentPrice}</span>
            <X className='w-3 h-3 text-muted-foreground' />
          </Link>
        )}
        {currentRating && currentRating !== 'all' && (
          <Link
            href={getDismissUrl('rating')}
            className='inline-flex items-center gap-1 text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700'
          >
            <span>{currentRating}★ {t.andUp}</span>
            <X className='w-3 h-3 text-muted-foreground' />
          </Link>
        )}
      </div>
    </div>
  );
}
