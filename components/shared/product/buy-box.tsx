'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{PRODUCT_COPY,productText}from '@/lib/product-language';

import { useState, useTransition } from 'react';
import { isTestFixtureSlug, isTestCatalogSlug } from '@/lib/test-fixture';
import T from '@/components/shared/i18n-text';
import LocalizedPrice from '@/components/shared/localized-price';
import { useRouter } from 'next/navigation';
import { Product, Cart } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Zap,
  RotateCcw,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useToast } from '@/hooks/use-toast';

export default function BuyBox({
  product,

  cart,
  testMode = false,
}: {
  product: Product;
  cart?: Cart;
  testMode?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const language=useStoreLanguage();const t=PRODUCT_COPY[language];
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();
  const itemInCart = cart?.items.find((x) => x.productId === product.id);

  const priceNum = Number(product.price);
  const totalPrice = (priceNum * qty).toFixed(2);

  const handleAddToCart = async (goToCheckout = false) => {
    startTransition(async () => {
      const res = await addItemToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        qty: qty,
        image: product.images[0] || '/images/products/placeholder.svg',
      });

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      // Dispatch custom event to open the Slideover Cart Sheet
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('omnistu:cart-updated', {
            detail: {
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0],
              qty: qty,
            },
          })
        );
      }

      if (goToCheckout) {
        router.push('/shipping-address');
      } else {
        toast({
          description: (
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-5 h-5 text-emerald-600' />
              <span>
                {t.addedCart}: {qty} × <strong>{product.name}</strong>
              </span>
            </div>
          ),
        });
      }
    });
  };

  if (isTestFixtureSlug(product.slug)) {
    return (
      <Card className='border border-red-300 shadow-md rounded-xl bg-card text-card-foreground'>
        <CardContent className='p-5 space-y-3'>
          <div className='rounded-md border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-900' data-testid='test-fixture-note'>
            {t.fixture}
          </div>
          <p className='text-xs text-muted-foreground'>
            {productText(language,'fixtureDetail',{cost:priceNum.toFixed(2),stock:product.stock})}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border border-neutral-200 dark:border-neutral-800 shadow-md rounded-xl bg-card text-card-foreground'>
      <CardContent className='p-5 space-y-4'>
        {/* Price & Savings Header */}
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <LocalizedPrice
              amountUsd={priceNum}
              showNote
              className='text-3xl font-extrabold tracking-tight'
              supClassName='text-sm align-super font-medium'
            />
          </div>
        </div>


        {/* Stock Urgency Indicator */}
        <div>
          {product.stock > 0 ? (
            <p className='text-emerald-600 dark:text-emerald-400 font-semibold text-base flex items-center gap-1.5'>
              <CheckCircle2 className='w-5 h-5' /> {t.demoCheckout}
            </p>
          ) : (
            <p className='text-destructive font-semibold text-base'>
              <T k='currentlyUnavailable' />
            </p>
          )}
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && (
          <div className='space-y-1.5'>
            <label className='text-xs font-medium text-muted-foreground flex items-center justify-between'>
              <span>{t.quantity}:</span>
              {itemInCart && <span className='text-[11px] text-primary font-normal'>{productText(language,'inCart',{qty:itemInCart.qty})}</span>}
            </label>
            <Select
              value={String(qty)}
              onValueChange={(val) => setQty(Number(val))}
            >
              <SelectTrigger aria-label={t.quantity} className='w-full bg-background border-neutral-300 dark:border-neutral-700 h-9'>
                <SelectValue placeholder='1' />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: Math.min(10, Math.max(1, product.stock)) },
                  (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i===0?t.single:productText(language,'items',{qty:i+1,cost:(priceNum*(i+1)).toFixed(2)})}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* CTA Action Buttons - hidden in sample-catalog preview mode:
            sample products have no database row, so cart actions would
            silently fail. Show an honest disabled state instead. */}
        {product.stock > 0 && product.id.startsWith('sample-') && (
          <div className='rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200' data-testid='sample-mode-note'>
            <T k='sampleModeNote' />
          </div>
        )}
        {isTestCatalogSlug(product.slug) && (
          <div className='rounded-md border border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-700 px-3 py-2.5 text-xs text-sky-900 dark:text-sky-200' data-testid='test-catalog-note'>
            {t.testCatalog}
          </div>
        )}
        {product.stock > 0 && !product.id.startsWith('sample-') && !isTestFixtureSlug(product.slug) && (!isTestCatalogSlug(product.slug) || testMode) && (
          <div className='space-y-2 pt-1'>
            {/* Add to Cart Button */}
            <Button
              id='add-to-cart-button'
              type='button'
              disabled={isPending}
              onClick={() => handleAddToCart(false)}
              className='w-full bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold rounded-full py-5 text-sm shadow transition-all duration-150 active:scale-[0.98]'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
              ) : (
                <ShoppingCart className='w-4 h-4 mr-2' />
              )}
              <T k='addToCart' /> {qty > 1 && `(${qty})`}
            </Button>

            {/* Buy Now Button (1-Click Instant Checkout) */}
            <Button
              id='buy-now-button'
              type='button'
              disabled={isPending}
              onClick={() => handleAddToCart(true)}
              className='w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full py-5 text-sm shadow transition-all duration-150 active:scale-[0.98]'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
              ) : (
                <Zap className='w-4 h-4 mr-2 fill-current' />
              )}
              <T k='buyNow' /> &bull; ${totalPrice}
            </Button>
          </div>
        )}

        {/* Enterprise Trust Table */}
        <div className='border-t border-neutral-200 dark:border-neutral-800 pt-3 text-xs space-y-1.5 text-muted-foreground'>
          <div className='flex flex-wrap justify-between gap-2 py-0.5'>
            <span><T k='shipsFrom' /></span>
            <span className='font-medium text-foreground'>{t.noFulfillment}</span>
          </div>
          <div className='flex flex-wrap justify-between gap-2 py-0.5'>
            <span><T k='soldBy' /></span>
            <span className='font-medium text-foreground'>{t.sampleSeller}</span>
          </div>
          <div className='flex flex-wrap justify-between gap-2 py-0.5'>
            <span><T k='returnsLabel' /></span>
            <span className='font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
              <RotateCcw className='w-3 h-3' /> <T k='refundPolicyDraft' />
            </span>
          </div>
          <div className='flex flex-wrap justify-between gap-2 py-0.5'>
            <span><T k='paymentLabel' /></span>
            <span className='font-medium text-foreground flex items-center gap-1'>
              <Lock className='w-3 h-3 text-neutral-500' /> {testMode ? t.simulated : t.paymentOff}
            </span>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
