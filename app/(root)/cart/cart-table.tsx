'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import {
  ArrowRight,
  CheckCircle2,
  Loader,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import { Cart, CartItem } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Recommended fallback items for empty cart
const RECOMMENDED_ITEMS = [
  {
    name: 'Silicone Magnetic Balls Fidget Toys (4-Pack)',
    slug: 'silicone-magnetic-balls-fidget-toys-for-adults-teens',
    category: 'Toys & Games',
    image: 'https://images.unsplash.com/photo-1516981879613-9f5da904015f?w=500&auto=format&fit=crop&q=80',
    price: '19.99',
    rating: '4.8',
    numReviews: 1240,
  },
  {
    name: 'Turmeric Kojic Glow Pads (90 Count)',
    slug: 'turmeric-kojic-glow-cleansing-pads-90ct',
    category: 'Beauty & Personal Care',
    image: 'https://images.unsplash.com/photo-1608248597359-543160a0f5df?w=500&auto=format&fit=crop&q=80',
    price: '24.95',
    rating: '4.9',
    numReviews: 890,
  },
  {
    name: 'Smart Health & Sleep Tracker Ring',
    slug: 'smart-health-sleep-tracker-ring',
    category: 'Electronics & Gadgets',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=80',
    price: '89.00',
    rating: '4.7',
    numReviews: 450,
  },
  {
    name: 'Hi-Fi Noise Cancelling Wireless Earbuds',
    slug: 'hi-fi-anc-wireless-earbuds-pro',
    category: 'Electronics & Gadgets',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80',
    price: '39.99',
    rating: '4.8',
    numReviews: 610,
  },
];

function AddButton({ item }: { item: CartItem }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      disabled={isPending}
      variant='outline'
      size='icon'
      className='h-7 w-7 rounded-sm border-neutral-300 dark:border-neutral-700'
      type='button'
      onClick={() =>
        startTransition(async () => {
          const res = await addItemToCart(item);
          if (!res.success) {
            toast({
              variant: 'destructive',
              description: res.message,
            });
          }
        })
      }
    >
      {isPending ? (
        <Loader className='w-3 h-3 animate-spin' />
      ) : (
        <Plus className='w-3 h-3' />
      )}
    </Button>
  );
}

function RemoveButton({ item }: { item: CartItem }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      disabled={isPending}
      variant='outline'
      size='icon'
      className='h-7 w-7 rounded-sm border-neutral-300 dark:border-neutral-700'
      type='button'
      onClick={() =>
        startTransition(async () => {
          const res = await removeItemFromCart(item.productId);
          if (!res.success) {
            toast({
              variant: 'destructive',
              description: res.message,
            });
          }
        })
      }
    >
      {isPending ? (
        <Loader className='w-3 h-3 animate-spin' />
      ) : (
        <Minus className='w-3 h-3' />
      )}
    </Button>
  );
}

const CartTable = ({ cart }: { cart?: Cart }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className='bg-[#eaeded] dark:bg-[#0f1111] min-h-screen py-6 px-4 md:px-8'>
      <div className='max-w-[1520px] mx-auto'>
        {isEmpty ? (
          /* ========================================================
             AMAZON EMPTY CART STATE WITH RECOMMENDATIONS & PERKS
             ======================================================== */
          <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
              {/* Left 3 Cols: Main Empty Card */}
              <div className='lg:col-span-3 bg-white dark:bg-[#1a202c] p-8 md:p-10 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none'>
                <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
                  <div className='w-24 h-24 shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600'>
                    <ShoppingCart className='w-12 h-12' />
                  </div>
                  <div className='space-y-3 text-center sm:text-left'>
                    <h1 className='text-2xl md:text-3xl font-bold text-[#0f1111] dark:text-white'>
                      Your Omnistu Cart is empty
                    </h1>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed'>
                      Your shopping cart lives to serve. Give it purpose — fill it with
                      electronics, streetwear, desk tech, sensory fidgets, and viral drops.
                    </p>
                    <div className='flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2'>
                      <Link href='/search?sort=deals'>
                        <Button className='bg-[#FFD814] hover:bg-[#F7CA00] text-neutral-900 font-bold px-6 h-10 rounded-full shadow-sm'>
                          Shop Today&apos;s Deals
                        </Button>
                      </Link>
                      <Link href='/sign-in'>
                        <Button
                          variant='outline'
                          className='border-neutral-300 dark:border-neutral-700 font-semibold px-6 h-10 rounded-full'
                        >
                          Sign in to your account
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className='border-t border-neutral-200 dark:border-neutral-800 mt-8 pt-4 text-xs text-neutral-500'>
                  The price and availability of items at Omnistu Superstore are subject to change. The Cart is a temporary place to store a list of your items and reflects each item&apos;s most recent price.
                </div>
              </div>

              {/* Right 1 Col: Direct Assurance Sidebar */}
              <div className='bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none space-y-4'>
                <h3 className='font-bold text-sm text-[#0f1111] dark:text-white flex items-center gap-1.5'>
                  <Sparkles className='w-4 h-4 text-amber-500' /> Omnistu Direct Benefits
                </h3>
                <ul className='space-y-3 text-xs text-neutral-600 dark:text-neutral-300'>
                  <li className='flex items-start gap-2'>
                    <Truck className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                    <span><strong>Free Express Shipping</strong> on orders over $25 or with FastPass.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <ShieldCheck className='w-4 h-4 text-emerald-600 shrink-0 mt-0.5' />
                    <span><strong>30-Day Money-Back Guarantee</strong> on all catalog items.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-blue-600 shrink-0 mt-0.5' />
                    <span><strong>Direct Manufacturer Fulfillment</strong> via CJ Dropshipping & Printify.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Recommended Products Carousel Shelf */}
            <div className='bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none'>
              <h2 className='text-lg md:text-xl font-bold text-[#0f1111] dark:text-white mb-4'>
                Customers who viewed items in your browsing history also bought
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
                {RECOMMENDED_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className='border border-neutral-200 dark:border-neutral-800 p-3 rounded flex flex-col justify-between hover:shadow-md transition'
                  >
                    <div>
                      <Link href={`/product/${item.slug}`}>
                        <div className='aspect-square relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 rounded mb-2'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='(max-width: 640px) 100vw, 25vw'
                            className='object-cover hover:scale-105 transition-transform duration-200'
                          />
                        </div>
                        <h4 className='text-xs font-semibold text-[#0f1111] dark:text-neutral-200 line-clamp-2 hover:text-[#c7511f] leading-snug'>
                          {item.name}
                        </h4>
                      </Link>
                      <div className='flex items-center gap-1 text-[11px] text-amber-500 mt-1'>
                        <span>★ {item.rating}</span>
                        <span className='text-neutral-400'>({item.numReviews})</span>
                      </div>
                      <div className='text-sm font-bold text-[#0f1111] dark:text-white mt-1'>
                        ${item.price}
                      </div>
                    </div>

                    <Link href={`/product/${item.slug}`} className='mt-3'>
                      <Button
                        size='sm'
                        className='w-full bg-[#FFD814] hover:bg-[#F7CA00] text-neutral-900 font-bold text-xs h-8 rounded-full'
                      >
                        View Product
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             AMAZON ACTIVE CART 2-COLUMN VIEW
             ======================================================== */
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-start'>
            {/* Left 3 Columns: Active Cart Items List */}
            <div className='lg:col-span-3 bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none space-y-4'>
              <div className='flex items-baseline justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3'>
                <h1 className='text-2xl md:text-3xl font-bold text-[#0f1111] dark:text-white'>
                  Shopping Cart
                </h1>
                <span className='text-xs text-neutral-500 font-medium'>Price</span>
              </div>

              {/* Items List */}
              <div className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                {cart.items.map((item) => (
                  <div key={item.slug} className='py-4 flex gap-4 items-start'>
                    {/* Thumbnail */}
                    <Link
                      href={`/product/${item.slug}`}
                      className='w-24 h-24 md:w-32 md:h-32 shrink-0 relative bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden'
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='128px'
                        className='object-cover'
                      />
                    </Link>

                    {/* Details */}
                    <div className='flex-1 space-y-1.5'>
                      <Link
                        href={`/product/${item.slug}`}
                        className='font-bold text-sm md:text-base text-[#0f1111] dark:text-white hover:text-[#c7511f] line-clamp-2 leading-tight'
                      >
                        {item.name}
                      </Link>

                      <div className='text-xs text-[#007600] font-semibold'>In Stock</div>
                      <div className='text-xs text-neutral-500'>
                        Eligible for <strong>FREE Express Shipping</strong>
                      </div>

                      {/* Quantity & Actions */}
                      <div className='flex flex-wrap items-center gap-3 pt-2 text-xs'>
                        <div className='flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700 rounded-md p-1 bg-neutral-50 dark:bg-neutral-800/40'>
                          <RemoveButton item={item} />
                          <span className='px-2 font-bold text-sm'>{item.qty}</span>
                          <AddButton item={item} />
                        </div>

                        <span className='text-neutral-300'>|</span>

                        <button
                          type='button'
                          onClick={() => removeItemFromCart(item.productId)}
                          className='text-xs text-[#007185] hover:text-[#c7511f] hover:underline flex items-center gap-1'
                        >
                          <Trash2 className='w-3.5 h-3.5' /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className='text-right'>
                      <div className='text-base md:text-lg font-bold text-[#0f1111] dark:text-white'>
                        ${item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Bottom Bar */}
              <div className='border-t border-neutral-200 dark:border-neutral-800 pt-4 text-right text-base md:text-lg'>
                Subtotal ({cart.items.reduce((a, c) => a + c.qty, 0)} items):{' '}
                <strong className='text-xl text-[#0f1111] dark:text-white font-extrabold'>
                  {formatCurrency(cart.itemsPrice)}
                </strong>
              </div>
            </div>

            {/* Right 1 Column: Sticky Amazon Checkout Box */}
            <div className='sticky top-20 bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none space-y-4'>
              <div className='text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1'>
                <CheckCircle2 className='w-4 h-4 shrink-0' />
                Part of your order qualifies for FREE Delivery.
              </div>

              <div className='text-lg font-medium'>
                Subtotal ({cart.items.reduce((a, c) => a + c.qty, 0)} items):{' '}
                <span className='font-extrabold text-xl text-[#0f1111] dark:text-white block pt-1'>
                  {formatCurrency(cart.itemsPrice)}
                </span>
              </div>

              <div className='flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300'>
                <input type='checkbox' id='is-gift' className='rounded text-amber-500' />
                <label htmlFor='is-gift' className='cursor-pointer'>
                  This order contains a gift
                </label>
              </div>

              <Button
                className='w-full bg-[#FFD814] hover:bg-[#F7CA00] text-neutral-900 font-bold h-11 rounded-full shadow-sm text-sm'
                disabled={isPending}
                onClick={() =>
                  startTransition(() => router.push('/shipping-address'))
                }
              >
                {isPending ? (
                  <Loader className='w-4 h-4 animate-spin mr-2' />
                ) : (
                  <ArrowRight className='w-4 h-4 mr-2' />
                )}
                Proceed to Checkout
              </Button>

              <div className='border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] text-neutral-500 space-y-1.5'>
                <div className='flex items-center gap-1 text-emerald-600 font-semibold'>
                  <ShieldCheck className='w-3.5 h-3.5' /> 256-bit Bank Grade Encryption
                </div>
                <div>We accept Visa, Mastercard, AMEX, PayPal, and Apple Pay.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartTable;
