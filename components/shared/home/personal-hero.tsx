import Link from 'next/link';
import { auth } from '@/auth';
import { getMyOrders } from '@/lib/actions/order.actions';
import { getMyCart } from '@/lib/actions/cart.actions';
import { isDatabaseAvailable } from '@/lib/utils';
import T from '@/components/shared/i18n-text';

// Signed-in: welcome back + real recent orders + real cart reminder.
// Signed-out: honest sign-in CTA (no invented recommendation promises).
export default async function PersonalHero() {
  if (!isDatabaseAvailable()) return null;
  const session = await auth();

  if (!session?.user) {
    return (
      <div className='w-full bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] py-8 px-4 text-center border-y border-neutral-100 dark:border-neutral-800'>
        <div className='max-w-2xl mx-auto space-y-3'>
          <p className='text-[14px] text-[#0f172a] dark:text-neutral-200'>
            <T k='signInForOrders' />
          </p>
          <div>
            <Link href='/sign-in'>
              <button className='bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-bold py-1.5 px-24 sm:px-28 rounded-full shadow-xs transition-colors cursor-pointer'>
                <T k='signIn' />
              </button>
            </Link>
          </div>
          <p className='text-[11px] text-[#0f172a] dark:text-neutral-400'>
            <T k='newCustomer' />{' '}
            <Link href='/sign-up' className='text-[#4f46e5] dark:text-[#56b6c2] hover:underline font-medium'>
              <T k='startHere' />
            </Link>
          </p>
        </div>
      </div>
    );
  }

  let orders: { id: string; createdAt: Date; totalPrice: unknown; isPaid: boolean }[] = [];
  let cartCount = 0;
  try {
    const [myOrders, cart] = await Promise.all([
      getMyOrders({ limit: 3, page: 1 }),
      getMyCart(),
    ]);
    orders = myOrders.data as typeof orders;
    cartCount = cart?.items?.reduce((sum: number, item: { qty: number }) => sum + item.qty, 0) ?? 0;
  } catch {
    // Orders/cart unavailable - render the welcome without them.
  }

  const firstName = (session.user.name || '').split(' ')[0] || session.user.email;

  return (
    <div className='bg-white dark:bg-[#1a202c] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] border-y border-neutral-100 dark:border-neutral-800 p-5'>
      <h2 className='text-[18px] md:text-[20px] font-bold text-[#0f172a] dark:text-white tracking-tight mb-3'>
        <T k='welcomeBack' />, {firstName}
      </h2>
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='border border-neutral-200/80 dark:border-neutral-800 rounded p-3'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-[13px] font-bold text-[#0f172a] dark:text-white'>
              <T k='yourRecentOrders' />
            </h3>
            <Link href='/user/orders' className='text-[12px] text-[#4f46e5] dark:text-[#56b6c2] hover:underline'>
              <T k='viewAllOrders' />
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className='text-[12px] text-[#565959] dark:text-neutral-400'>
              <T k='noOrdersYet' />
            </p>
          ) : (
            <ul className='space-y-1.5'>
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/order/${o.id}`}
                    className='flex items-center justify-between text-[12px] text-[#0f172a] dark:text-neutral-200 hover:text-[#4f46e5] group'
                  >
                    <span className='truncate'>#{o.id.slice(0, 8)} &middot; {new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className='shrink-0 ml-2 font-medium'>
                      ${Number(o.totalPrice).toFixed(2)} &middot; {o.isPaid ? <T k='paid' /> : <T k='notPaid' />}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href='/cart'
          className='border border-neutral-200/80 dark:border-neutral-800 rounded p-3 hover:border-[#4f46e5] transition-colors flex flex-col justify-center'
        >
          <h3 className='text-[13px] font-bold text-[#0f172a] dark:text-white mb-1'>
            <T k='pickUpYourCart' />
          </h3>
          <p className='text-[12px] text-[#565959] dark:text-neutral-400'>
            {cartCount > 0
              ? <>{cartCount} {cartCount === 1 ? <T k='itemInCartSingular' /> : <T k='itemsInCartPlural' />}</>
              : <T k='cartEmpty' />}
          </p>
        </Link>
      </div>
    </div>
  );
}
