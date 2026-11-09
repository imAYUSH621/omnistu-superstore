import {qualifiedSelectionEnabled} from '@/lib/retail/gate';
import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { Metadata } from 'next';
import{cookies}from 'next/headers';
import{supportLanguage}from '@/lib/support-language';
import{CHECKOUT_COPY}from '@/lib/checkout-language';
import { redirect } from 'next/navigation';
import { ShippingAddress } from '@/types';
import ShippingAddressForm from './shipping-address-form';
import CheckoutSteps from '@/components/shared/checkout-steps';

export async function generateMetadata():Promise<Metadata>{const l=supportLanguage('',(await cookies()).get('omnistu_lang')?.value);return{title:CHECKOUT_COPY[l].addressTitle}}

const ShippingAddressPage = async () => {
  const cart = await getMyCart();

  if (!qualifiedSelectionEnabled() && (!cart || cart.items.length === 0)) redirect('/cart');

  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) throw new Error('No user ID');

  const user = await getUserById(userId);

  return (
    <>
      <CheckoutSteps current={1} />
      <ShippingAddressForm address={user.address as ShippingAddress} />
    </>
  );
};

export default ShippingAddressPage;
