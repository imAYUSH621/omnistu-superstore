import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amazon.com Shopping Cart',
  description: 'Review your items and proceed to checkout.',
};

export default async function CartPage() {
  const cart = await getMyCart();

  return (
    <div className='w-full bg-[#eaeded] dark:bg-[#0f1111] min-h-[85vh] font-["Amazon_Ember",Arial,sans-serif]'>
      <CartTable cart={cart} />
    </div>
  );
}
