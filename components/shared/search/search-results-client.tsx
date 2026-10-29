'use client';

import { useState } from 'react';
import { Product } from '@/types';
import SearchResultsHeader from './search-results-header';
import ProductHorizontalCard from './product-horizontal-card';
import ProductCard from '@/components/shared/product/product-card';
import DealsCarouselStrip from './deals-carousel-strip';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface SearchResultsClientProps {
  products: Product[];
  totalResults: number;
  featuredDeals: Product[];
  currentQ: string;
  currentCategory: string;
  currentPrice: string;
  currentRating: string;
  currentSort: string;
}

export default function SearchResultsClient({
  products,
  totalResults,
  featuredDeals,
  currentQ,
  currentCategory,
  currentPrice,
  currentRating,
  currentSort,
}: SearchResultsClientProps) {
  // Default viewMode to 'list' for high-converting Amazon horizontal card layout
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className='flex-1 min-w-0'>
      {/* Search Results Header with Sort & View Mode Switcher */}
      <SearchResultsHeader
        totalResults={totalResults}
        currentQ={currentQ}
        currentCategory={currentCategory}
        currentPrice={currentPrice}
        currentRating={currentRating}
        currentSort={currentSort}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      {/* No Products Found State */}
      {products.length === 0 ? (
        <div className='text-center py-16 px-4 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3'>
          <h2 className='text-lg font-bold text-foreground'>No products found</h2>
          <p className='text-sm text-muted-foreground max-w-md mx-auto'>
            We couldn&apos;t find any items matching your selected filters. Try broadening your search or resetting filters.
          </p>
          <Button asChild variant='outline' className='rounded-full text-xs'>
            <Link href='/search' className='flex items-center gap-1.5'>
              <RotateCcw className='w-3.5 h-3.5' /> Reset All Filters
            </Link>
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        /* List / Horizontal Card Stream */
        <div className='space-y-4'>
          {products.map((product, idx) => (
            <div key={product.id}>
              <ProductHorizontalCard product={product} />

              {/* Embedded In-Grid Deal Carousel after 2nd product */}
              {idx === 1 && featuredDeals.length > 0 && (
                <DealsCarouselStrip deals={featuredDeals} />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Grid Layout Stream */
        <div className='space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Embedded In-Grid Deal Carousel */}
          {featuredDeals.length > 0 && <DealsCarouselStrip deals={featuredDeals} />}

          {products.length > 3 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {products.slice(3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
