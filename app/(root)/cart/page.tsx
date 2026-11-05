import {sampleCatalogAllowed}from '@/lib/test-fixture';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { hasPreservedGuestCart } from '@/lib/auth-cart-lifecycle';
import CartTable from './cart-table';
import { testCheckoutMode } from '@/lib/payment-capabilities';
import { getMyCart } from '@/lib/actions/cart.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your items and proceed to checkout.',
};

export default async function CartPage() {
  const cart = await getMyCart();
  const session = await auth();
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  const preserved = session?.user?.id && sessionCartId ? await hasPreservedGuestCart(session.user.id, sessionCartId) : false;

  return (
    <div className='w-full bg-[#f8fafc] dark:bg-[#0f172a] min-h-[85vh] font-sans'>
      {preserved && <p role='status' className='mx-auto max-w-6xl p-4 text-sm bg-amber-50 text-amber-950 border border-amber-200'>Your signed-in cart is shown below. Items from your guest visit were kept separately and were not merged or removed. They are not part of this checkout.</p>}
      <CartTable cart={cart} testMode={testCheckoutMode()} showDemoRecommendations={sampleCatalogAllowed()} />
    </div>
  );
}
