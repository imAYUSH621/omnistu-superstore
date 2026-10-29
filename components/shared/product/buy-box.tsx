'use client';

import { useState, useTransition } from 'react';
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
  ShieldCheck,
  RotateCcw,
  Truck,
  Lock,
  Heart,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { addItemToCart } from '@/lib/actions/cart.actions';
import { useToast } from '@/hooks/use-toast';

export default function BuyBox({
  product,
  cart,
}: {
  product: Product;
  cart?: Cart;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const itemInCart = cart?.items.find((x) => x.productId === product.id);

  const priceNum = Number(product.price);
  const msrpNum = Number((priceNum * 1.45).toFixed(2));
  const savingsPercent = Math.round(((msrpNum - priceNum) / msrpNum) * 100);
  const totalPrice = (priceNum * qty).toFixed(2);

  const handleAddToCart = async (goToCheckout = false) => {
    startTransition(async () => {
      const res = await addItemToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        qty: qty,
        image: product.images[0] || '/images/sample-products/p1-1.jpg',
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
                Added {qty}x <strong>{product.name.slice(0, 30)}...</strong> to cart!
              </span>
            </div>
          ),
        });
      }
    });
  };

  return (
    <Card className='border border-neutral-200 dark:border-neutral-800 shadow-md rounded-xl bg-card text-card-foreground'>
      <CardContent className='p-5 space-y-4'>
        {/* Price & Savings Header */}
        <div className='space-y-1'>
          <div className='flex items-baseline gap-2'>
            <span className='text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded'>
              -{savingsPercent}%
            </span>
            <span className='text-3xl font-extrabold tracking-tight'>
              <sup className='text-sm align-super font-medium'>$</sup>
              {Math.floor(priceNum)}
              <sup className='text-sm align-super font-medium'>
                {(priceNum % 1).toFixed(2).slice(2)}
              </sup>
            </span>
          </div>
          <div className='text-xs text-muted-foreground flex items-center gap-1.5'>
            <span>Typical price:</span>
            <span className='line-through'>${msrpNum.toFixed(2)}</span>
          </div>
        </div>

        {/* Prime Fast Delivery Guarantee */}
        <div className='bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-lg p-3 space-y-1.5'>
          <div className='flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm'>
            <Truck className='w-4 h-4 text-emerald-600' />
            <span>FREE delivery Tomorrow</span>
          </div>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            Order within <strong className='text-foreground'>3 hrs 15 mins</strong> with Omnistu Express Priority.
          </p>
          <div className='text-xs text-muted-foreground flex items-center gap-1 pt-1'>
            <span>Deliver to</span>
            <strong className='text-foreground hover:underline cursor-pointer'>
              United States &bull; Priority Hub
            </strong>
          </div>
        </div>

        {/* Stock Urgency Indicator */}
        <div>
          {product.stock > 10 ? (
            <p className='text-emerald-600 dark:text-emerald-400 font-semibold text-lg flex items-center gap-1.5'>
              <CheckCircle2 className='w-5 h-5' /> In Stock
            </p>
          ) : product.stock > 0 ? (
            <p className='text-amber-600 dark:text-amber-500 font-semibold text-base flex items-center gap-1.5'>
              Only {product.stock} left in stock - order soon.
            </p>
          ) : (
            <p className='text-destructive font-semibold text-base'>
              Currently Unavailable
            </p>
          )}
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && (
          <div className='space-y-1.5'>
            <label className='text-xs font-medium text-muted-foreground flex items-center justify-between'>
              <span>Quantity:</span>
              {itemInCart && <span className='text-[11px] text-primary font-normal'>{itemInCart.qty} in cart</span>}
            </label>
            <Select
              value={String(qty)}
              onValueChange={(val) => setQty(Number(val))}
            >
              <SelectTrigger className='w-full bg-background border-neutral-300 dark:border-neutral-700 h-9'>
                <SelectValue placeholder='1' />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: Math.min(10, Math.max(1, product.stock)) },
                  (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1} {i === 0 ? '(Single item)' : `items ($${(priceNum * (i + 1)).toFixed(2)})`}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* CTA Action Buttons */}
        {product.stock > 0 && (
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
              Add to Cart {qty > 1 && `(${qty})`}
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
              Buy Now &bull; ${totalPrice}
            </Button>
          </div>
        )}

        {/* Enterprise Trust Table */}
        <div className='border-t border-neutral-200 dark:border-neutral-800 pt-3 text-xs space-y-1.5 text-muted-foreground'>
          <div className='flex justify-between py-0.5'>
            <span>Ships from</span>
            <span className='font-medium text-foreground'>Omnistu Direct Hub</span>
          </div>
          <div className='flex justify-between py-0.5'>
            <span>Sold by</span>
            <span className='font-medium text-foreground'>Omnistu Official</span>
          </div>
          <div className='flex justify-between py-0.5'>
            <span>Returns</span>
            <span className='font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
              <RotateCcw className='w-3 h-3' /> 30-Day Guarantee
            </span>
          </div>
          <div className='flex justify-between py-0.5'>
            <span>Payment</span>
            <span className='font-medium text-foreground flex items-center gap-1'>
              <Lock className='w-3 h-3 text-neutral-500' /> Secure SSL (Stripe / PayPal)
            </span>
          </div>
        </div>

        {/* Secondary Wishlist / Gift Row */}
        <div className='pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 text-xs text-muted-foreground'>
          <button
            type='button'
            onClick={() => {
              setIsWishlisted(!isWishlisted);
              toast({
                description: isWishlisted
                  ? 'Removed from your Wishlist'
                  : 'Added to your Wishlist!',
              });
            }}
            className='flex items-center gap-1 hover:text-foreground transition'
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isWishlisted ? 'text-red-500 fill-red-500' : ''
              }`}
            />
            <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
          </button>
          <div className='flex items-center gap-1'>
            <ShieldCheck className='w-3.5 h-3.5 text-emerald-600' />
            <span>Buyer Protection</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
