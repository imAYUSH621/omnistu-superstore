'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{PRODUCT_COPY,productText}from '@/lib/product-language';
import{homeDepartment}from '@/lib/home-language';

import { useTransition } from 'react';
import { isTestFixtureSlug } from '@/lib/test-fixture';
import Link from 'next/link';
import LocalizedPrice from '@/components/shared/localized-price';
import { ProductImage } from '@/components/shared/product/product-image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import Rating from './rating';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useToast } from '@/hooks/use-toast';

const ProductCard = ({ product }: { product: Product }) => {
  const { toast } = useToast();
  const language=useStoreLanguage();const t=PRODUCT_COPY[language];
  const [isPending, startTransition] = useTransition();

  const priceNum = Number(product.price);
  const isFixture = isTestFixtureSlug(product.slug);

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
        {product.isFeatured && (
          <span className='bg-indigo-600 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow-sm'>
            {t.featured}
          </span>
        )}
      </div>

      <CardHeader className='p-0 overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 aspect-square flex items-center justify-center relative'>
        <Link href={`/product/${product.slug}`} className='w-full h-full relative'>
          <ProductImage
            src={product.images[0] || '/images/products/placeholder.svg'}
            alt={product.name}
            sizes='(max-width: 767px) 45vw, (max-width: 1279px) 25vw, 20vw'
            className='object-contain p-4 group-hover:scale-105 transition-transform duration-300'
            priority={false}
          />
          {isFixture && (
            <span className='absolute bottom-0 left-0 right-0 bg-red-700/95 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white' data-testid='placeholder-image-label'>
              {t.placeholder}
            </span>
          )}
        </Link>
      </CardHeader>

      {/* Product Metadata */}
      <CardContent className='p-2.5 sm:p-4 flex flex-col justify-between flex-1 gap-3'>
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between text-[11px] text-muted-foreground uppercase tracking-wider font-semibold'>
            <span>{product.brand ?? ''}</span>
            {isFixture && <span className='rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800' data-testid='test-fixture-badge'>{t.fixture}</span>}
            <span className='truncate max-w-[120px]'>{homeDepartment(product.category,language)}</span>
          </div>

          <Link href={`/product/${product.slug}`} className='group-hover:text-primary transition'>
            <h2 className='text-sm font-semibold line-clamp-2 leading-snug text-foreground'>
              {product.name}
            </h2>
          </Link>

          {/* Star Rating - only for products with real review data */}
          {Number(product.numReviews) > 0 ? (
            <div className='flex items-center gap-1.5 pt-0.5'>
              <Rating value={Number(product.rating)} />
              <span className='text-xs text-muted-foreground'>
                ({product.numReviews.toLocaleString()})
              </span>
            </div>
          ) : (
            <p className='text-xs text-muted-foreground pt-0.5'>{t.noReviews}</p>
          )}
        </div>

        {/* Pricing Block & Prime Delivery */}
        <div className='space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80'>
          {isFixture ? (
            <p className='text-xs text-red-900' data-testid='fixture-card-cost'>
              {productText(language,'reference',{cost:priceNum.toFixed(2)})}
            </p>
          ) : (
          <div className='flex items-baseline gap-2'>
            <LocalizedPrice
              amountUsd={priceNum}
              className='text-xl font-extrabold text-foreground tracking-tight'
              supClassName='text-xs align-super font-normal'
            />
          </div>
          )}

          {/* Quick Add To Cart Button */}
          {isFixture ? (
            <p className='rounded-md border border-red-300 bg-red-50 px-2 py-1.5 text-center text-xs font-bold text-red-900' data-testid='fixture-card-note'>{t.fixture}</p>
          ) : product.stock > 0 ? (
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
              {t.quickAdd}
            </Button>
          ) : (
            <p className='text-xs text-destructive font-semibold pt-1'>
              {t.outOfStock}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
