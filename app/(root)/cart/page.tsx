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
    <div className='max-w-[1520px] mx-auto px-4 md:px-6 py-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <CartTable cart={cart} />
    </div>
  );
}
