'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingCart, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface CartToastEventDetail {
  productId: string;
  name: string;
  price: string;
  image: string;
  qty: number;
}

export default function CartDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [latestItem, setLatestItem] = useState<CartToastEventDetail | null>(null);

  useEffect(() => {
    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CartToastEventDetail>;
      if (customEvent.detail) {
        setLatestItem(customEvent.detail);
        setIsOpen(true);
      }
    };

    window.addEventListener('omnistu:cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('omnistu:cart-updated', handleCartUpdate);
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side='right' className='w-full sm:max-w-md p-6 flex flex-col justify-between'>
        <div className='space-y-6'>
          {/* Header */}
          <SheetHeader className='text-left pb-4 border-b border-neutral-200 dark:border-neutral-800'>
            <div className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
              <CheckCircle2 className='w-6 h-6' />
              <SheetTitle className='text-lg font-bold text-foreground'>
                Added to Shopping Cart
              </SheetTitle>
            </div>
            <SheetDescription className='text-xs text-muted-foreground'>
              Item has been reserved in your session cart.
            </SheetDescription>
          </SheetHeader>

          {/* Added Product Card */}
          {latestItem && (
            <div className='flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'>
              <div className='relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white border'>
                <Image
                  src={latestItem.image || '/images/sample-products/p1-1.jpg'}
                  alt={latestItem.name}
                  fill
                  sizes='80px'
                  className='object-contain p-1'
                />
              </div>
              <div className='flex-1 min-w-0 space-y-1'>
                <h4 className='text-sm font-semibold text-foreground line-clamp-2 leading-tight'>
                  {latestItem.name}
                </h4>
                <p className='text-xs text-muted-foreground'>
                  Qty: <span className='font-bold text-foreground'>{latestItem.qty}</span>
                </p>
                <p className='text-base font-bold text-foreground'>
                  ${Number(latestItem.price).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Free Shipping Qualification Banner */}
          <div className='bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs space-y-1.5'>
            <div className='flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300'>
              <span>Free Delivery Qualified</span>
              <span className='text-emerald-600 font-bold'>100% Free</span>
            </div>
            <div className='w-full bg-emerald-200 dark:bg-emerald-900 h-1.5 rounded-full overflow-hidden'>
              <div className='bg-emerald-600 h-full w-full' />
            </div>
            <p className='text-muted-foreground text-[11px]'>
              Your order qualifies for FREE Express Shipping with guaranteed next-day dispatch.
            </p>
          </div>

          {/* Quick recommendations */}
          <div className='pt-2 space-y-2 text-xs text-muted-foreground'>
            <div className='flex items-center gap-1.5 font-semibold text-foreground'>
              <Zap className='w-3.5 h-3.5 text-amber-500 fill-amber-500' />
              <span>Recommended Amazon Best Seller</span>
            </div>
            <Link
              href='/product/silicone-magnetic-balls-fidget-toys'
              onClick={() => setIsOpen(false)}
              className='flex items-center justify-between p-2.5 rounded-lg border hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition'
            >
              <span className='truncate max-w-[240px] font-medium text-foreground'>
                Silicone Magnetic Balls (4PCS)
              </span>
              <span className='font-bold text-emerald-600'>$12.99 &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5'>
          {/* Proceed to Checkout Primary Button */}
          <Button
            type='button'
            onClick={() => {
              setIsOpen(false);
              router.push('/shipping-address');
            }}
            className='w-full bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold rounded-full py-5 text-sm shadow transition-all duration-150'
          >
            Proceed to Checkout
            <ArrowRight className='w-4 h-4 ml-2' />
          </Button>

          {/* View Cart Secondary Button */}
          <Button
            asChild
            variant='outline'
            className='w-full rounded-full py-5 text-sm font-semibold border-neutral-300 dark:border-neutral-700'
          >
            <Link href='/cart' onClick={() => setIsOpen(false)}>
              <ShoppingCart className='w-4 h-4 mr-2' />
              View & Edit Cart
            </Link>
          </Button>

          {/* Keep Shopping / Close */}
          <SheetClose asChild>
            <Button variant='ghost' className='w-full text-xs text-muted-foreground hover:text-foreground'>
              Continue Shopping
            </Button>
          </SheetClose>

          {/* Security badge */}
          <div className='flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1'>
            <ShieldCheck className='w-3.5 h-3.5 text-emerald-600' />
            <span>256-Bit SSL Encrypted Checkout &bull; 30-Day Guarantee</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
