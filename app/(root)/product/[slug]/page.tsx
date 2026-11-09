import{cookies}from 'next/headers';
import{supportLanguage}from '@/lib/support-language';
import{PRODUCT_COPY}from '@/lib/product-language';
import{homeDepartment}from '@/lib/home-language';
import {qualifiedSelectionEnabled,boundRetailCheckoutEnabled} from '@/lib/retail/gate';
import {loadQualifiedOptions} from '@/lib/retail/store';
import QualifiedBuyBox from '@/components/shared/retail/qualified-buy-box';
import { getProductBySlug } from '@/lib/actions/product.actions';
import { isTestFixtureSlug } from '@/lib/test-fixture';
import T from '@/components/shared/i18n-text';
import { notFound } from 'next/navigation';
import ProductImages from '@/components/shared/product/product-images';
import BuyBox from '@/components/shared/product/buy-box';
import { testCheckoutMode } from '@/lib/payment-capabilities';
import { getMyCart } from '@/lib/actions/cart.actions';
import ReviewList from './review-list';
import { auth } from '@/auth';
import Rating from '@/components/shared/product/rating';
import Link from 'next/link';
import { ChevronRight, Award } from 'lucide-react';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;
  const language=supportLanguage('',(await cookies()).get('omnistu_lang')?.value);const t=PRODUCT_COPY[language];

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id;

  const cart = await getMyCart();

  return (
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 py-6 space-y-8 font-sans'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        <Link href='/' className='hover:text-foreground transition'>
          <T k='homeLabel' />
        </Link>
        <ChevronRight className='w-3.5 h-3.5' />
        <Link
          href={`/search?category=${encodeURIComponent(product.category)}`}
          className='hover:text-foreground transition font-medium'
        >
          {homeDepartment(product.category,language)}
        </Link>
        <ChevronRight className='w-3.5 h-3.5' />
        <span className='truncate max-w-[200px] text-foreground font-semibold'>
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase Section */}
      <section>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          {/* Images Column (5 Cols) */}
          <div className='lg:col-span-5 bg-white dark:bg-[#1a202c] p-4 border border-[#e7e7e7] dark:border-neutral-800 rounded-sm shadow-xs'>
            <ProductImages images={product.images} placeholder={isTestFixtureSlug(product.slug)} />
          </div>

          {/* Details & Specs Column (4 Cols) */}
          <div className='lg:col-span-4 space-y-5 bg-white dark:bg-[#1a202c] p-6 border border-[#e7e7e7] dark:border-neutral-800 rounded-sm shadow-xs'>
            {/* Featured badge & Category */}
            <div className='flex items-center gap-2'>
              {product.isFeatured && (
                <span className='inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-sm shadow-xs'>
                  <Award className='w-3.5 h-3.5' /> {t.featured}
                </span>
              )}
              <span className='text-xs text-muted-foreground'>
                {homeDepartment(product.category,language)}
              </span>
            </div>

            {/* Product Title */}
            <h1 className='text-xl md:text-2xl font-bold text-foreground leading-tight'>
              {product.name}
            </h1>

            {/* Brand Link */}
            {product.brand ? (
              <p className='text-xs text-muted-foreground'>
                <T k='brandLabel' />{' '}
                <span className='text-[#4f46e5] dark:text-[#56b6c2] font-semibold hover:underline cursor-pointer'>
                  {product.brand}
                </span>
              </p>
            ) : null}

            {/* Star Rating & Reviews */}
            {Number(product.numReviews) > 0 ? (
              <div className='flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4'>
                <div className='flex items-center gap-1.5'>
                  <Rating value={Number(product.rating)} />
                  <span className='font-bold text-sm text-foreground'>
                    {product.rating}
                  </span>
                </div>
                <span className='text-xs text-[#4f46e5] dark:text-[#56b6c2]'>
                  {product.numReviews.toLocaleString()} <T k='ratingsReviews' />
                </span>
              </div>
            ) : (
              <p className='border-b border-neutral-200 dark:border-neutral-800 pb-4 text-xs text-muted-foreground' data-testid='no-reviews-yet'>
                {t.noReviews}
              </p>
            )}

            {/* Description */}
            {product.description && product.description.trim() ? (
              <div className='border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-1.5'>
                <h3 className='font-bold text-sm text-foreground'><T k='aboutThisItem' /></h3>
                <p className='text-xs text-muted-foreground leading-relaxed whitespace-pre-line'>
                  {product.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* Authentic Buy Box Column (3 Cols) */}
          <div className='lg:col-span-3'>
            {qualifiedSelectionEnabled() ? <QualifiedBuyBox mode={boundRetailCheckoutEnabled()?'bound':'test'} signedIn={!!userId} {...(userId ? await loadQualifiedOptions(userId,product.id) : {status:'available' as const,options:[]})}/> : <BuyBox product={product} cart={cart} testMode={testCheckoutMode()} />}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className='pt-8 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a202c] p-6 rounded-sm shadow-xs'>
        <h2 className='text-xl font-bold mb-6 text-foreground flex items-center gap-2'>
          {t.customerReviews}
        </h2>
        <ReviewList
          userId={userId || ''}
          productId={product.id}
          productSlug={product.slug}
        />
      </section>
    </div>
  );
};

export default ProductDetailsPage;
