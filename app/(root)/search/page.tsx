import {
  getAllProducts,
  getAllCategories,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import SearchNarrowChips from '@/components/shared/search/search-narrow-chips';
import SearchFacetedSidebar from '@/components/shared/search/search-faceted-sidebar';
import SearchFiltersCollapsible from '@/components/shared/search/search-filters-collapsible';
import { catalogSource } from '@/lib/utils';
import SearchResultsClient from '@/components/shared/search/search-results-client';

export async function generateMetadata(props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    rating?: string;
  }>;
}) {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    rating = 'all',
  } = await props.searchParams;

  const isQuerySet = q && q !== 'all' && q.trim() !== '';
  const isCategorySet = category && category !== 'all' && category.trim() !== '';
  const isPriceSet = price && price !== 'all' && price.trim() !== '';
  const isRatingSet = rating && rating !== 'all' && rating.trim() !== '';

  if (isQuerySet || isCategorySet || isPriceSet || isRatingSet) {
    return {
      title: `Search ${isQuerySet ? q : ''} ${
        isCategorySet ? `: Category ${category}` : ''
      } ${isPriceSet ? `: Price ${price}` : ''} ${
        isRatingSet ? `: Rating ${rating}` : ''
      } | Omnistu Superstore`,
    };
  } else {
    return {
      title: 'Search Products | Omnistu Superstore',
    };
  }
}

const SearchPage = async (props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  }>;
}) => {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    rating = 'all',
    sort = 'newest',
    page = '1',
  } = await props.searchParams;

  // Fetch products and faceted categories dynamically from database / catalog
  const productsResult = await getAllProducts({
    query: q,
    category,
    price,
    rating,
    sort,
    page: Number(page),
    limit: 24,
  });

  const categories = await getAllCategories();
  const featuredDeals = await getFeaturedProducts();

  return (
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 py-4 space-y-4 font-sans'>
      {/* 1. Top "Narrow your search" Horizontal Category Chips */}
      <SearchNarrowChips categories={categories} />

      {/* 2. Main Search Body: Left Faceted Sidebar + Right Results Stream */}
      <div className='flex flex-col md:flex-row gap-6 items-stretch md:items-start'>
        {/* Left Faceted Navigation Sidebar (collapsible on mobile, sticky on desktop) */}
        <SearchFiltersCollapsible>
          <SearchFacetedSidebar
            categories={categories}
            currentCategory={category}
            currentPrice={price}
            currentRating={rating}
            currentSort={sort}
            currentQ={q}
            showIdeas={catalogSource() === 'sample'}
          />
        </SearchFiltersCollapsible>

        {/* Right Search Results Stream */}
        <SearchResultsClient
          products={productsResult.data}
          totalResults={productsResult.data.length}
          featuredDeals={featuredDeals}
          currentQ={q}
          currentCategory={category}
          currentPrice={price}
          currentRating={rating}
          currentSort={sort}
        />
      </div>
    </div>
  );
};

export default SearchPage;
