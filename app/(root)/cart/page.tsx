import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your items and proceed to checkout.',
};

export default async function CartPage() {
  const cart = await getMyCart();

  return (
    <div className='w-full bg-[#f8fafc] dark:bg-[#0f172a] min-h-[85vh] font-sans'>
      <CartTable cart={cart} />
    </div>
  );
}
