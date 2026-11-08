'use client';

import { useRouter } from 'next/navigation';
import CT from '@/components/shared/cart-text';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {CART_COPY} from '@/lib/cart-language';
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


// Recommended fallback items for empty cart with verified local assets
const RECOMMENDED_ITEMS = [
  {
    name: 'Silicone Magnetic Balls Fidget Toys (4-Pack)',
    slug: 'silicone-magnetic-balls-fidget-toys',
    category: 'Toys & Games',
    image: '/images/products/silicone-magnetic-balls-1.svg',
    price: '12.99',
  },
  {
    name: 'Omnistu Cyber Heavyweight Graphic Hoodie (300DPI)',
    slug: 'omnistu-cyber-heavyweight-graphic-hoodie',
    category: 'Apparel & Merch',
    image: '/images/products/placeholder.svg',
    price: '58.95',
  },
  {
    name: 'Active Noise-Cancelling Wireless Earbuds Pro',
    slug: 'active-noise-cancelling-wireless-earbuds-pro',
    category: 'Electronics & Gadgets',
    image: '/images/products/anc-earbuds-1.svg',
    price: '49.99',
  },
  {
    name: 'Smart Gravity Induction Constant Temp Coffee Mug Warmer',
    slug: 'smart-gravity-induction-coffee-mug-warmer',
    category: 'Home & Kitchen',
    image: '/images/products/smart-mug-warmer-1.svg',
    price: '24.99',
  },
];

function AddButton({ item }: { item: CartItem }) {
  const { toast } = useToast();
  const lang=useStoreLanguage();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      aria-label={CART_COPY[lang].increase}
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
  const lang=useStoreLanguage();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      aria-label={CART_COPY[lang].decrease}
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

const CartTable = ({ cart, testMode = false, showDemoRecommendations = false }: { cart?: Cart; testMode?: boolean; showDemoRecommendations?: boolean }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className='bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen py-6 px-4 md:px-8'>
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
                    <h1 className='text-2xl md:text-3xl font-bold text-[#0f172a] dark:text-white'>
                      <CT name='emptyTitle'/>
                    </h1>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed'>
                      <CT name='emptyBody'/>
                    </p>
                    <div className='flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2'>
                      <Link href='/search'>
                        <Button className='bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold px-6 h-10 rounded-full shadow-sm'>
                          <CT name='browse'/>
                        </Button>
                      </Link>
                      <Link href='/sign-in'>
                        <Button
                          variant='outline'
                          className='border-neutral-300 dark:border-neutral-700 font-semibold px-6 h-10 rounded-full'
                        >
                          <CT name='signIn'/>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className='border-t border-neutral-200 dark:border-neutral-800 mt-8 pt-4 text-xs text-neutral-500'>
                  <CT name='priceNotice'/>
                </div>
              </div>

              {/* Right 1 Col: Direct Assurance Sidebar */}
              <div className='bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none space-y-4'>
                <h3 className='font-bold text-sm text-[#0f172a] dark:text-white flex items-center gap-1.5'>
                  <Sparkles className='w-4 h-4 text-amber-500' /> <CT name='shippingTitle'/>
                </h3>
                <ul className='space-y-3 text-xs text-neutral-600 dark:text-neutral-300'>
                  <li className='flex items-start gap-2'>
                    <Truck className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                    <span>{testMode
                      ? <CT name='testShipping'/> : <CT name='shipping'/>}</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <ShieldCheck className='w-4 h-4 text-emerald-600 shrink-0 mt-0.5' />
                    <span><CT name='draftRefund'/></span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='w-4 h-4 text-blue-600 shrink-0 mt-0.5' />
                    <span>{testMode
                      ? <CT name='testDelivery'/> : <CT name='delivery'/>}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Recommended Products Carousel Shelf */}
            {showDemoRecommendations && <div className='bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none'>
              <h2 className='text-lg md:text-xl font-bold text-[#0f172a] dark:text-white mb-4'>
                <CT name='demo'/>
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
                        <h4 className='text-xs font-semibold text-[#0f172a] dark:text-neutral-200 line-clamp-2 hover:text-[#c7511f] leading-snug'>
                          {item.name}
                        </h4>
                      </Link>
                      <div className='text-sm font-bold text-[#0f172a] dark:text-white mt-1'>
                        {item.price} USD
                      </div>
                    </div>

                    <Link href={`/product/${item.slug}`} className='mt-3'>
                      <Button
                        size='sm'
                        className='w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs h-8 rounded-full'
                      >
                        <CT name='view'/>
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        ) : (
          /* ========================================================
             AMAZON ACTIVE CART 2-COLUMN VIEW
             ======================================================== */
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 items-start'>
            {/* Left 3 Columns: Active Cart Items List */}
            <div className='lg:col-span-3 bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none space-y-4'>
              <div className='flex items-baseline justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3'>
                <h1 className='text-2xl md:text-3xl font-bold text-[#0f172a] dark:text-white'>
                  <CT name='title'/>
                </h1>
                <span className='text-xs text-neutral-500 font-medium'><CT name='price'/></span>
              </div>

              {/* Items List */}
              <div className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                {cart.items.map((item) => (
                  <div key={item.slug} className='py-4 flex flex-wrap sm:flex-nowrap gap-4 items-start'>
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
                    <div className='min-w-0 flex-1 space-y-1.5 break-words'>
                      <Link
                        href={`/product/${item.slug}`}
                        className='font-bold text-sm md:text-base text-[#0f172a] dark:text-white hover:text-[#c7511f] line-clamp-2 leading-tight'
                      >
                        {item.name}
                      </Link>


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
                          className='text-xs text-[#4f46e5] hover:text-[#c7511f] hover:underline flex items-center gap-1'
                        >
                          <Trash2 className='w-3.5 h-3.5' /> <CT name='removeOne'/>
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className='text-right'>
                      <div className='text-base md:text-lg font-bold text-[#0f172a] dark:text-white'>
                        {item.price} USD
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Bottom Bar */}
              <div className='border-t border-neutral-200 dark:border-neutral-800 pt-4 text-right text-base md:text-lg'>
                <CT name='subtotal'/> ({cart.items.reduce((a, c) => a + c.qty, 0)} <CT name='items'/>):{' '}
                <strong className='text-xl text-[#0f172a] dark:text-white font-extrabold'>
                  {cart.itemsPrice} USD
                </strong>
              </div>
            </div>

            {/* Right 1 Column: Sticky Amazon Checkout Box */}
            <div className='sticky top-20 bg-white dark:bg-[#1a202c] p-6 shadow-[0_2px_5px_rgba(213,217,217,0.6)] dark:shadow-md border border-[#d5d9d9]/70 dark:border-neutral-800 rounded-none space-y-4'>

              <div className='text-lg font-medium'>
                <CT name='subtotal'/> ({cart.items.reduce((a, c) => a + c.qty, 0)} <CT name='items'/>):{' '}
                <span className='font-extrabold text-xl text-[#0f172a] dark:text-white block pt-1'>
                  {cart.itemsPrice} USD
                </span>
              </div>


              <Button
                className='w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold h-11 rounded-full shadow-sm text-sm'
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
                <CT name='checkout'/>
              </Button>

              {testMode && (
                <div className='border-t border-neutral-200 dark:border-neutral-800 pt-3 text-[11px] text-neutral-500 space-y-1.5'>
                  <div className='flex items-center gap-1'>
                    <ShieldCheck className='w-3.5 h-3.5' /> <CT name='testPayment'/>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartTable;
