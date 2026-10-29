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
import TrustRibbon from '@/components/shared/home/trust-ribbon';

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className='space-y-8 pb-10'>
      {/* Featured Carousel */}
      {featuredProducts.length > 0 && (
        <ProductCarousel data={featuredProducts} />
      )}

      {/* Trust & Guarantee Ribbon */}
      <TrustRibbon />

      {/* Amazon-Style Category Quads */}
      <CategoryQuads />

      {/* Newest Arrivals & Best Sellers Grid */}
      <ProductList
        data={latestProducts}
        title='Trending Best Sellers & New Arrivals'
        limit={12}
      />

      <ViewAllProductsButton />

      {/* Limited-Time Flash Deals */}
      <DealCountdown />

      {/* Enterprise Guarantees */}
      <IconBoxes />
    </div>
  );
};

export default Homepage;
