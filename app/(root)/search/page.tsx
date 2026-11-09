import{cookies}from 'next/headers';
import{supportLanguage}from '@/lib/support-language';
import{SEARCH_COPY}from '@/lib/search-language';
import{homeDepartment}from '@/lib/home-language';
import { searchPage, searchPrice, searchRating, searchSort } from '@/lib/search-input';
import {
  getAllProducts,
  getAllCategories,
  getFacetCounts,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import SearchNarrowChips from '@/components/shared/search/search-narrow-chips';
import SearchFacetedSidebar from '@/components/shared/search/search-faceted-sidebar';
import SearchFiltersCollapsible from '@/components/shared/search/search-filters-collapsible';
import { catalogSource } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Pagination from '@/components/shared/pagination';
import SearchResultsClient from '@/components/shared/search/search-results-client';

export async function generateMetadata(props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price?: string;
    rating?: string;
  }>;
}) {
  const language=supportLanguage('',(await cookies()).get('omnistu_lang')?.value);const t=SEARCH_COPY[language];
  const {
    q = 'all',
    category = 'all',
    price: rawPrice = 'all',
    rating: rawRating = 'all',
  } = await props.searchParams;
  const price = searchPrice(rawPrice);
  const rating = searchRating(rawRating);

  const isQuerySet = q && q !== 'all' && q.trim() !== '';
  const isCategorySet = category && category !== 'all' && category.trim() !== '';
  const isPriceSet = price && price !== 'all' && price.trim() !== '';
  const isRatingSet = rating && rating !== 'all' && rating.trim() !== '';

  if (isQuerySet || isCategorySet || isPriceSet || isRatingSet) {
    return {
      title: `${t.title} ${isQuerySet ? q : ''} ${
        isCategorySet ? `: ${t.category} ${homeDepartment(category,language)}` : ''
      } ${isPriceSet ? `: ${t.price} ${price}` : ''} ${
        isRatingSet ? `: ${t.reviews} ${rating}` : ''
      } | Omnistu Superstore`,
    };
  } else {
    return {
      title: t.title+' | Omnistu Superstore',
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
    price: rawPrice = 'all',
    rating: rawRating = 'all',
    sort: rawSort = 'newest',
    page: rawPage = '1',
  } = await props.searchParams;
  const price = searchPrice(rawPrice);
  const rating = searchRating(rawRating);

  const page = searchPage(rawPage);
  const sort = searchSort(rawSort);

  // Fetch products and faceted categories dynamically from database / catalog
  const productsResult = await getAllProducts({
    query: q,
    category,
    price,
    rating,
    sort,
    page,
    limit: 24,
  });

  // A page past the end goes to the last real page (keeps the other filters).
  const requestedPage = page;
  if (productsResult.totalPages > 0 && requestedPage > productsResult.totalPages) {
    const params = new URLSearchParams();
    if (q && q !== 'all') params.set('q', q);
    if (category && category !== 'all') params.set('category', category);
    if (price && price !== 'all') params.set('price', price);
    if (rating && rating !== 'all') params.set('rating', rating);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (productsResult.totalPages > 1) params.set('page', String(productsResult.totalPages));
    redirect(`/search${params.toString() ? `?${params}` : ''}`);
  }

  // Independent reads run in parallel instead of three sequential round trips.
  const [categories, facetCounts, featuredDeals] = await Promise.all([
    getAllCategories(),
    getFacetCounts({ query: q, category }),
    getFeaturedProducts(),
  ]);

  return (
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 py-4 space-y-4 font-sans'>
      {/* 1. Top "Narrow your search" Horizontal Category Chips */}
      <SearchNarrowChips categories={categories} facetCounts={facetCounts} />

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
            facetCounts={facetCounts}
            showIdeas={catalogSource() === 'sample'}
          />
        </SearchFiltersCollapsible>

        {/* Right Search Results Stream */}
        <div className='flex-1 min-w-0'>
        <SearchResultsClient
          products={productsResult.data}
          totalResults={productsResult.totalCount}
          page={page}
          pageSize={24}
          featuredDeals={featuredDeals}
          currentQ={q}
          currentCategory={category}
          currentPrice={price}
          currentRating={rating}
          currentSort={sort}
        />
        {productsResult.totalPages > 1 && (
          <div className='flex justify-center py-4'>
            <Pagination page={page} totalPages={productsResult.totalPages} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
