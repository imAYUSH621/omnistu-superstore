import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getMyOrders } from '@/lib/actions/order.actions';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getMyReturns } from '@/lib/actions/return.actions';
import T from '@/components/shared/i18n-text';

export const metadata = { title: 'Account Overview | Omnistu Superstore' };

// Account overview: only the signed-in user's own orders, cart and
// return requests - no invented recommendations or tracking.
export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in?callbackUrl=/user');

  const [orderState,cartState,returnState]=await Promise.allSettled([
    getMyOrders({limit:3,page:1}),getMyCart(),getMyReturns(),
  ]);
  const ordersFailed=orderState.status==='rejected';
  const cartFailed=cartState.status==='rejected';
  const returnsFailed=returnState.status==='rejected'||!returnState.value.success||!Array.isArray(returnState.value.data);
  const orders=orderState.status==='fulfilled'?orderState.value.data:[];
  const cartCount=cartState.status==='fulfilled'?(cartState.value?.items?.reduce((sum:number,item:{qty:number})=>sum+item.qty,0)??0):0;
  const returns=!returnsFailed&&returnState.status==='fulfilled'?(returnState.value.data as {id:string;status:string;createdAt:string}[]).slice(0,3):[];

  const firstName = (session.user.name || '').split(' ')[0] || session.user.email;

  return (
    <div className='max-w-[1200px] mx-auto px-4 py-6 space-y-4'>
      <h1 className='text-[22px] font-bold text-[#0f172a] dark:text-white tracking-tight'>
        <T k='welcomeBack' />, {firstName}
      </h1>

      <div className='grid md:grid-cols-3 gap-4'>
        {/* Recent orders */}
        <div className='border border-neutral-200 dark:border-neutral-800 rounded p-4 bg-white dark:bg-[#1a202c]'>
          <div className='flex items-center justify-between mb-2'>
            <h2 className='text-[14px] font-bold text-[#0f172a] dark:text-white'>
              <T k='yourRecentOrders' />
            </h2>
            <Link href='/user/orders' className='text-[12px] text-[#4f46e5] dark:text-[#56b6c2] hover:underline'>
              <T k='viewAllOrders' />
            </Link>
          </div>
          {ordersFailed?<p role='alert' className='text-sm text-destructive'><T k='accountOrdersUnavailable'/></p>:orders.length === 0 ? (
            <p className='text-[12px] text-[#565959] dark:text-neutral-400'>
              <T k='noOrdersYet' />
            </p>
          ) : (
            <ul className='space-y-1.5'>
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/order/${o.id}`}
                    className='flex items-center justify-between text-[12px] text-[#0f172a] dark:text-neutral-200 hover:text-[#4f46e5]'
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

        {/* Cart reminder */}
        <Link
          href='/cart'
          className='border border-neutral-200 dark:border-neutral-800 rounded p-4 bg-white dark:bg-[#1a202c] hover:border-[#4f46e5] transition-colors'
        >
          <h2 className='text-[14px] font-bold text-[#0f172a] dark:text-white mb-1'>
            <T k='pickUpYourCart' />
          </h2>
          <p className='text-[12px] text-[#565959] dark:text-neutral-400'>
            {cartFailed?<span role='alert' className='text-destructive'><T k='accountCartUnavailable'/></span>:cartCount > 0
              ? <>{cartCount} {cartCount === 1 ? <T k='itemInCartSingular' /> : <T k='itemsInCartPlural' />}</>
              : <T k='cartEmpty' />}
          </p>
        </Link>

        {/* Return requests */}
        <div className='border border-neutral-200 dark:border-neutral-800 rounded p-4 bg-white dark:bg-[#1a202c]'>
          <div className='flex items-center justify-between mb-2'>
            <h2 className='text-[14px] font-bold text-[#0f172a] dark:text-white'>
              <T k='yourReturns' />
            </h2>
            <Link href='/returns' className='text-[12px] text-[#4f46e5] dark:text-[#56b6c2] hover:underline'>
              <T k='requestReturn' />
            </Link>
          </div>
          {returnsFailed?<p role='alert' className='text-sm text-destructive'><T k='accountReturnsUnavailable'/></p>:returns.length === 0 ? (
            <p className='text-[12px] text-[#565959] dark:text-neutral-400'>
              <T k='noReturnsYet' />
            </p>
          ) : (
            <ul className='space-y-1.5'>
              {returns.map((r) => (
                <li
                  key={r.id}
                  className='flex items-center justify-between text-[12px] text-[#0f172a] dark:text-neutral-200'
                >
                  <span className='truncate'>#{r.id.slice(0, 8)} &middot; {new Date(r.createdAt).toLocaleDateString()}</span>
                  <span className='shrink-0 ml-2 font-medium'>{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
