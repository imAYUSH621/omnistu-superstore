import ProductList from '@/components/shared/product/product-list';
import {
  getLatestProducts,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import ProductCarousel from '@/components/shared/product/product-carousel';
import ViewAllProductsButton from '@/components/view-all-products-button';
import IconBoxes from '@/components/icon-boxes';
import DealCountdown from '@/components/deal-countdown';
import CategoryQuads from '@/components/shared/home/category-quads';
import DealsShelf from '@/components/shared/home/deals-shelf';
import TrustRibbon from '@/components/shared/home/trust-ribbon';

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className='space-y-6 pb-12 bg-[#eaeded] dark:bg-[#0f1111] min-h-screen'>
      {/* 1. Amazon Hero Carousel with Bottom Fade */}
      {featuredProducts.length > 0 && (
        <ProductCarousel data={featuredProducts} />
      )}

      {/* 2. 8 Authoritative Gateway Quads Overlapping Hero */}
      <CategoryQuads />

      {/* 3. Amazon "Today's Deals" Shelf */}
      <DealsShelf />

      {/* 4. Trust & Direct Guarantee Ribbon */}
      <div className='max-w-[1520px] mx-auto px-4 md:px-6'>
        <TrustRibbon />
      </div>

      {/* 5. Trending Best Sellers & New Arrivals Grid */}
      <div className='max-w-[1520px] mx-auto px-4 md:px-6 bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none'>
        <ProductList
          data={latestProducts}
          title='Trending Best Sellers & New Arrivals'
          limit={12}
        />
        <div className='mt-6'>
          <ViewAllProductsButton />
        </div>
      </div>

      {/* 6. Limited-Time Flash Deals Countdown */}
      <div className='max-w-[1520px] mx-auto px-4 md:px-6'>
        <DealCountdown />
      </div>

      {/* 7. Enterprise Buyer Guarantees */}
      <div className='max-w-[1520px] mx-auto px-4 md:px-6'>
        <IconBoxes />
      </div>
    </div>
  );
};

export default Homepage;
