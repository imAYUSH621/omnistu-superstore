'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import Rating from '@/components/shared/product/rating';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Heart, ShieldCheck, Zap, Loader2 } from 'lucide-react';
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

  const priceNum = Number(product.price);
  const msrpNum = Number((priceNum * 1.35).toFixed(2));
  const savingsPercent = Math.round(((msrpNum - priceNum) / msrpNum) * 100);
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
        image: product.images[0] || '/images/products/silicone-magnetic-balls-1.svg',
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
    <div className='group relative border border-neutral-200 dark:border-neutral-800 rounded-xl bg-card hover:shadow-md transition-all duration-200 p-4 flex flex-col md:flex-row gap-5 items-stretch'>
      {/* 1. Left Thumbnail Area */}
      <div className='relative w-full md:w-56 h-56 flex-shrink-0 bg-neutral-50 dark:bg-neutral-900/60 rounded-lg overflow-hidden flex items-center justify-center p-3'>
        {/* Badges */}
        <div className='absolute top-2 left-2 z-10 flex flex-col gap-1'>
          {product.isFeatured ? (
            <span className='bg-amber-400 text-neutral-950 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm'>
              #1 Best Seller
            </span>
          ) : (
            <span className='bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm'>
              Limited Deal
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
          <Image
            src={product.images[0] || '/images/products/silicone-magnetic-balls-1.svg'}
            alt={product.name}
            fill
            sizes='(max-width: 768px) 100vw, 224px'
            className='object-contain group-hover:scale-105 transition-transform duration-300'
          />
        </Link>
      </div>

      {/* 2. Middle Content Area */}
      <div className='flex-1 flex flex-col justify-between space-y-2 min-w-0'>
        <div>
          {/* Brand & Category Breadcrumb */}
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span className='font-semibold text-primary/80'>{product.brand || 'Omnistu'}</span>
            <span>•</span>
            <span>{product.category}</span>
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

          {/* Ratings & Social Proof */}
          <div className='flex items-center gap-2 mt-1.5 flex-wrap'>
            <Rating value={Number(product.rating)} />
            <span className='text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
              {Number(product.rating).toFixed(1)}
            </span>
            <span className='text-xs text-muted-foreground'>
              ({Number(product.numReviews).toLocaleString()} reviews)
            </span>
            <span className='text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded font-medium'>
              1K+ bought in past month
            </span>
          </div>

          {/* Pricing Row */}
          <div className='mt-2.5 flex items-baseline gap-2 flex-wrap'>
            <span className='bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded'>
              -{savingsPercent}%
            </span>
            <div className='flex items-start text-foreground'>
              <span className='text-xs font-bold leading-none mt-1'>$</span>
              <span className='text-2xl font-black tracking-tight leading-none'>
                {wholePrice}
              </span>
              <span className='text-xs font-bold leading-none mt-0.5'>
                {fractionPrice}
              </span>
            </div>
            <span className='text-xs text-muted-foreground line-through'>
              Typical: ${msrpNum.toFixed(2)}
            </span>
          </div>

          {/* Prime Express Delivery Tag */}
          <div className='mt-2 flex items-center gap-2 text-xs'>
            <span className='inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded text-[11px] border border-sky-200 dark:border-sky-800'>
              <Zap className='w-3 h-3 fill-sky-500' /> Express Tomorrow
            </span>
            <span className='text-muted-foreground'>
              FREE delivery <strong className='text-foreground'>Tomorrow, 2 PM</strong>
            </span>
          </div>

          {/* Stock / Urgency */}
          {product.stock <= 5 ? (
            <p className='text-xs text-red-600 dark:text-red-400 font-semibold mt-1'>
              Only {product.stock} left in stock - order soon.
            </p>
          ) : (
            <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1'>
              <ShieldCheck className='w-3.5 h-3.5' /> In Stock & Ready to Ship
            </p>
          )}
        </div>
      </div>

      {/* 3. Right Action Box */}
      <div className='w-full md:w-48 flex-shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-100 dark:border-neutral-800 pt-3 md:pt-0 md:pl-5 space-y-3'>
        <div className='text-xs text-muted-foreground space-y-1 hidden md:block'>
          <p className='font-medium text-foreground'>Ships from:</p>
          <p>Omnistu Fulfillment Hub</p>
          <p className='font-medium text-foreground pt-1'>Sold by:</p>
          <p>Omnistu Direct Official</p>
        </div>

        <div className='space-y-2 pt-2'>
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

          <Button
            asChild
            variant='outline'
            className='w-full text-xs h-9 rounded-full border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          >
            <Link href={`/product/${product.slug}`}>See options</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
