'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import Rating from './rating';
import { ShoppingCart, Heart, Truck, Loader2 } from 'lucide-react';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useToast } from '@/hooks/use-toast';

const ProductCard = ({ product }: { product: Product }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const priceNum = Number(product.price);
  const msrpNum = Number((priceNum * 1.45).toFixed(2));
  const savingsPercent = Math.round(((msrpNum - priceNum) / msrpNum) * 100);

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
        image: product.images[0] || '/images/sample-products/p1-1.jpg',
      });

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      // Trigger Cart Drawer Slideover
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
    <Card className='group relative flex flex-col justify-between overflow-hidden border border-neutral-200 dark:border-neutral-800 rounded-xl bg-card hover:shadow-lg transition-all duration-200'>
      {/* Badges Overlay */}
      <div className='absolute top-2.5 left-2.5 z-10 flex flex-col gap-1'>
        {product.isFeatured ? (
          <span className='bg-amber-400 text-neutral-900 font-bold text-[11px] px-2 py-0.5 rounded shadow-sm'>
            #1 Best Seller
          </span>
        ) : (
          <span className='bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-sm'>
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
              : 'Added to your Wishlist!',
          });
        }}
        className='absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-900/90 shadow-sm flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-red-500 transition'
        aria-label='Save to Wishlist'
      >
        <Heart
          className={`w-4 h-4 ${
            isWishlisted ? 'text-red-500 fill-red-500' : ''
          }`}
        />
      </button>

      {/* Product Image */}
      <CardHeader className='p-0 overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 aspect-square flex items-center justify-center relative'>
        <Link href={`/product/${product.slug}`} className='w-full h-full relative'>
          <Image
            src={product.images[0] || '/images/sample-products/p1-1.jpg'}
            alt={product.name}
            fill
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
            priority={false}
          />
        </Link>
      </CardHeader>

      {/* Product Metadata */}
      <CardContent className='p-4 flex flex-col justify-between flex-1 gap-3'>
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between text-[11px] text-muted-foreground uppercase tracking-wider font-semibold'>
            <span>{product.brand}</span>
            <span className='truncate max-w-[120px]'>{product.category}</span>
          </div>

          <Link href={`/product/${product.slug}`} className='group-hover:text-primary transition'>
            <h2 className='text-sm font-semibold line-clamp-2 leading-snug text-foreground'>
              {product.name}
            </h2>
          </Link>

          {/* Star Rating with Numeric Count */}
          <div className='flex items-center gap-1.5 pt-0.5'>
            <Rating value={Number(product.rating)} />
            <span className='text-xs text-muted-foreground'>
              ({product.numReviews.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Pricing Block & Prime Delivery */}
        <div className='space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80'>
          <div className='flex items-baseline gap-2'>
            <span className='text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 rounded'>
              -{savingsPercent}%
            </span>
            <span className='text-xl font-extrabold text-foreground tracking-tight'>
              <sup className='text-xs align-super font-normal'>$</sup>
              {Math.floor(priceNum)}
              <sup className='text-xs align-super font-normal'>
                {(priceNum % 1).toFixed(2).slice(2)}
              </sup>
            </span>
            <span className='text-xs text-muted-foreground line-through'>
              ${msrpNum.toFixed(2)}
            </span>
          </div>

          {/* Prime Delivery Promise */}
          <div className='flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium'>
            <Truck className='w-3.5 h-3.5 text-emerald-600' />
            <span>FREE Delivery Tomorrow</span>
          </div>

          {/* Quick Add To Cart Button */}
          {product.stock > 0 ? (
            <Button
              type='button'
              onClick={handleQuickAdd}
              disabled={isPending}
              className='w-full mt-1 bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold rounded-full py-2 h-9 text-xs shadow-sm transition active:scale-95'
            >
              {isPending ? (
                <Loader2 className='w-3.5 h-3.5 animate-spin mr-1.5' />
              ) : (
                <ShoppingCart className='w-3.5 h-3.5 mr-1.5' />
              )}
              Quick Add
            </Button>
          ) : (
            <p className='text-xs text-destructive font-semibold pt-1'>
              Out Of Stock
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
