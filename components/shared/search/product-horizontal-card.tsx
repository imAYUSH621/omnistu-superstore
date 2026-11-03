'use client';

import { useState, useTransition } from 'react';
import { isTestFixtureSlug } from '@/lib/test-fixture';
import Link from 'next/link';
import { ProductImage } from '@/components/shared/product/product-image';
import { Product } from '@/types';
import Rating from '@/components/shared/product/rating';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Heart, Loader2 } from 'lucide-react';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useToast } from '@/hooks/use-toast';

interface ProductHorizontalCardProps {
  product: Product;
}

export default function ProductHorizontalCard({ product }: ProductHorizontalCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const isFixture = isTestFixtureSlug(product.slug);
  const priceNum = Number(product.price);
  const wholePrice = Math.floor(priceNum);
  const fractionPrice = (priceNum % 1).toFixed(2).substring(2);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const res = await addItemToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        qty: 1,
        image: product.images[0] || '/images/products/placeholder.svg',
      });

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);

      // Slide out the interactive CartDrawer
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('omnistu:cart-updated', {
            detail: {
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0],
              qty: 1,
            },
          })
        );
      }
    });
  };

  return (
    <div className='group relative border border-neutral-200 dark:border-neutral-800 rounded-xl bg-card hover:shadow-md transition-all duration-200 p-4 flex flex-col lg:flex-row gap-5 items-stretch'>
      {/* 1. Left Thumbnail Area */}
      <div className='relative w-full lg:w-56 h-56 flex-shrink-0 bg-neutral-50 dark:bg-neutral-900/60 rounded-lg overflow-hidden flex items-center justify-center p-3'>
        {/* Badges */}
        <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
          {product.isFeatured && (
            <span className='bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm'>
              Featured
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type='button'
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
            toast({
              description: isWishlisted
                ? 'Removed from your Wishlist'
                : 'Saved to your Wishlist!',
            });
          }}
          className='absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-sm flex items-center justify-center text-neutral-500 hover:text-red-500 transition'
          aria-label='Save to Wishlist'
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isWishlisted ? 'text-red-500 fill-red-500' : ''
            }`}
          />
        </button>

        <Link href={`/product/${product.slug}`} className='relative w-full h-full block'>
          <ProductImage
            src={product.images[0] || '/images/products/placeholder.svg'}
            alt={product.name}
            sizes='(max-width: 768px) 100vw, 224px'
            className='object-contain group-hover:scale-105 transition-transform duration-300'
          />
          {isFixture && (
            <span className='absolute bottom-0 left-0 right-0 bg-red-700/95 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white' data-testid='placeholder-image-label'>
              Placeholder image - not a photo of this product
            </span>
          )}
        </Link>
      </div>

      {/* 2. Middle Content Area */}
      <div className='flex-1 flex flex-col justify-between space-y-2 min-w-0'>
        <div>
          {/* Brand & Category Breadcrumb */}
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            {product.brand ? (
              <>
                <span className='font-semibold text-primary/80'>{product.brand}</span>
                <span>•</span>
              </>
            ) : null}
            <span>{product.category}</span>
            {isTestFixtureSlug(product.slug) && <span className='rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800' data-testid='test-fixture-badge'>TEST FIXTURE - not for sale</span>}
          </div>

          {/* Product Title */}
          <h2 className='text-base md:text-lg font-semibold text-foreground leading-snug line-clamp-2 mt-1'>
            <Link
              href={`/product/${product.slug}`}
              className='hover:text-primary transition-colors hover:underline'
            >
              {product.name}
            </Link>
          </h2>

          {/* Ratings - only shown for products with real review data */}
          {Number(product.numReviews) > 0 ? (
            <div className='flex items-center gap-2 mt-1.5 flex-wrap'>
              <Rating value={Number(product.rating)} />
              <span className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                {Number(product.rating).toFixed(1)}
              </span>
              <span className='text-xs text-muted-foreground'>
                ({Number(product.numReviews).toLocaleString()} reviews)
              </span>
            </div>
          ) : (
            <p className='text-xs text-muted-foreground mt-1.5'>No reviews yet</p>
          )}

          {isFixture ? (
            <p className='mt-2.5 text-xs text-red-900' data-testid='fixture-card-cost'>
              <span className='font-bold'>Reference only</span> - supplier cost ${priceNum.toFixed(2)}, not a sale price
              {Number((product as { variantCount?: number }).variantCount) > 1 && (
                <span data-testid='fixture-variant-count'>
                  {' '}| {(product as { variantCount?: number }).variantCount} supplier options{(product as { variantCostFrom?: string | null }).variantCostFrom ? `, lowest reference cost $${(product as { variantCostFrom?: string | null }).variantCostFrom}` : ''}
                </span>
              )}
            </p>
          ) : (
          <>
          {/* Pricing Row */}
          <div className='mt-2.5 flex items-baseline gap-2 flex-wrap'>
            <div className='flex items-start text-foreground'>
              <span className='text-xs font-bold leading-none mt-1'>$</span>
              <span className='text-2xl font-black tracking-tight leading-none'>
                {wholePrice}
              </span>
              <span className='text-xs font-bold leading-none mt-0.5'>
                {fractionPrice}
              </span>
            </div>
          </div>


          </>
          )}

          {/* Stock status - honest states only, no urgency copy */}
          {isFixture ? null : product.stock === 0 ? (
            <p className='text-xs text-muted-foreground mt-1'>
              Currently unavailable - supplier stock not yet verified
            </p>
          ) : (
            <p className='text-xs text-muted-foreground mt-1'>
              Demo catalog item - test mode, no real fulfillment
            </p>
          )}
        </div>
      </div>

      {/* 3. Right Action Box */}
      <div className='w-full lg:w-48 flex-shrink-0 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-neutral-800 pt-3 lg:pt-0 lg:pl-5 space-y-3'>

        <div className='space-y-2 pt-2'>
          {isFixture ? (
            <p className='rounded-md border border-red-300 bg-red-50 px-2 py-1.5 text-center text-xs font-bold text-red-900' data-testid='fixture-card-note'>Test fixture - not for sale</p>
          ) : (
          <Button
            type='button'
            onClick={handleQuickAdd}
            disabled={isPending || product.stock === 0}
            className='w-full bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-xs py-2 h-9 rounded-full shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5'
          >
            {isPending ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : added ? (
              <>
                <Check className='w-4 h-4 text-emerald-700' />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className='w-3.5 h-3.5' />
                <span>Add to cart</span>
              </>
            )}
          </Button>
          )}

          <Button
            asChild
            variant='outline'
            className='w-full text-xs h-9 rounded-full border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          >
            <Link href={`/product/${product.slug}`}>{isFixture ? 'View details' : 'See options'}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
