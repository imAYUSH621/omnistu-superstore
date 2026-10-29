import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductImages from '@/components/shared/product/product-images';
import BuyBox from '@/components/shared/product/buy-box';
import { getMyCart } from '@/lib/actions/cart.actions';
import ReviewList from './review-list';
import { auth } from '@/auth';
import Rating from '@/components/shared/product/rating';
import Link from 'next/link';
import { ChevronRight, Award, ShieldCheck, Check, Sparkles } from 'lucide-react';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id;

  const cart = await getMyCart();

  return (
    <div className='space-y-8 py-4'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        <Link href='/' className='hover:text-foreground transition'>
          Home
        </Link>
        <ChevronRight className='w-3.5 h-3.5' />
        <Link
          href={`/search?category=${product.category}`}
          className='hover:text-foreground transition font-medium'
        >
          {product.category}
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
          <div className='lg:col-span-5'>
            <ProductImages images={product.images} />
          </div>

          {/* Details & Specs Column (4 Cols) */}
          <div className='lg:col-span-4 space-y-5'>
            {/* Best Seller Ribbon & Category */}
            <div className='flex items-center gap-2'>
              <span className='inline-flex items-center gap-1 text-[11px] font-bold bg-amber-400 text-neutral-900 px-2.5 py-0.5 rounded-sm shadow-xs'>
                <Award className='w-3.5 h-3.5' /> #1 Best Seller
              </span>
              <span className='text-xs text-muted-foreground'>
                in {product.category}
              </span>
            </div>

            {/* Product Title */}
            <h1 className='text-2xl md:text-3xl font-extrabold text-foreground leading-tight'>
              {product.name}
            </h1>

            {/* Brand Link */}
            <p className='text-xs text-muted-foreground'>
              Brand:{' '}
              <span className='text-primary font-semibold hover:underline cursor-pointer'>
                {product.brand}
              </span>
            </p>

            {/* Star Rating & Reviews */}
            <div className='flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4'>
              <div className='flex items-center gap-1.5'>
                <Rating value={Number(product.rating)} />
                <span className='font-bold text-sm text-foreground'>
                  {product.rating}
                </span>
              </div>
              <span className='text-xs text-muted-foreground'>
                {product.numReviews.toLocaleString()} ratings & reviews
              </span>
            </div>

            {/* Feature Highlights Bullet Points */}
            <div className='space-y-2.5 pt-1 text-xs text-foreground'>
              <p className='font-bold text-sm text-foreground flex items-center gap-1.5'>
                <Sparkles className='w-4 h-4 text-amber-500' />
                Key Product Highlights
              </p>
              <ul className='space-y-2 text-muted-foreground'>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong className='text-foreground'>Premium Quality:</strong> Engineered using durable, precision-molded components tested for extended use.
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong className='text-foreground'>Guaranteed Express Dispatch:</strong> Ships directly from Omnistu Fulfillment Hub within 24 hours.
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong className='text-foreground'>30-Day Money-Back Guarantee:</strong> Full refund or replacement if you are not 100% satisfied.
                  </span>
                </li>
                <li className='flex items-start gap-2'>
                  <Check className='w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5' />
                  <span>
                    <strong className='text-foreground'>Universal Compatibility:</strong> Rigorously inspected and certified for safety and longevity.
                  </span>
                </li>
              </ul>
            </div>

            {/* Description */}
            <div className='border-t border-neutral-200 dark:border-neutral-800 pt-4 space-y-1.5'>
              <h3 className='font-bold text-sm text-foreground'>About this item</h3>
              <p className='text-xs text-muted-foreground leading-relaxed whitespace-pre-line'>
                {product.description}
              </p>
            </div>
          </div>

          {/* Authentic Buy Box Column (3 Cols) */}
          <div className='lg:col-span-3'>
            <BuyBox product={product} cart={cart} />
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className='pt-8 border-t border-neutral-200 dark:border-neutral-800'>
        <h2 className='text-2xl font-bold mb-6 text-foreground flex items-center gap-2'>
          Customer Reviews & Verified Feedback
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
