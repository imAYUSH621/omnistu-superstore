import {qualifiedRetailTestEnabled} from '@/lib/retail/gate';
import {readQualifiedCart} from '@/lib/retail/store';
import QualifiedCart from '@/components/shared/retail/qualified-cart';
import {sampleCatalogAllowed}from '@/lib/test-fixture';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { hasPreservedGuestCart } from '@/lib/auth-cart-lifecycle';
import CartTable from './cart-table';
import { testCheckoutMode } from '@/lib/payment-capabilities';
import { getMyCart } from '@/lib/actions/cart.actions';
import { Metadata } from 'next';
import CT from '@/components/shared/cart-text';
import {CART_COPY} from '@/lib/cart-language';
import {supportLanguage} from '@/lib/support-language';

export async function generateMetadata():Promise<Metadata>{const lang=supportLanguage('',(await cookies()).get('omnistu_lang')?.value);return{title:CART_COPY[lang].title,description:CART_COPY[lang].description}}

export default async function CartPage() {
  if(qualifiedRetailTestEnabled()) {const viewer=await auth();return viewer?.user?.id ? <QualifiedCart cart={await readQualifiedCart(viewer.user.id)}/> : <p className='p-8'><CT name='signInCart'/></p>;}
  let cart;try{cart=await getMyCart()}catch{return <main className='mx-auto max-w-4xl p-8'><h1 className='text-2xl font-semibold'><CT name='title'/></h1><p role='alert'><CT name='unavailable'/></p></main>}
  const session = await auth();
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  const preserved = session?.user?.id && sessionCartId ? await hasPreservedGuestCart(session.user.id, sessionCartId) : false;

  return (
    <div className='w-full bg-[#f8fafc] dark:bg-[#0f172a] min-h-[85vh] font-sans'>
      {preserved && <p role='status' className='mx-auto max-w-6xl p-4 text-sm bg-amber-50 text-amber-950 border border-amber-200'><CT name='preserved'/></p>}
      <CartTable cart={cart} testMode={testCheckoutMode()} showDemoRecommendations={sampleCatalogAllowed()} />
    </div>
  );
}
