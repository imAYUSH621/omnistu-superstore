import {CHECKOUT_COPY} from '@/lib/checkout-language';
import {qualifiedSelectionEnabled,boundRetailCheckoutEnabled} from '@/lib/retail/gate';
import {readQualifiedCart} from '@/lib/retail/store';
import QualifiedCart from '@/components/shared/retail/qualified-cart';
import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { ShippingAddress } from '@/types';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CheckoutSteps from '@/components/shared/checkout-steps';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import{cookies}from 'next/headers';
import{supportLanguage}from '@/lib/support-language';
import{REVIEW_COPY}from '@/lib/review-language';
import RT from '@/components/shared/review-text';
import PlaceOrderForm from './place-order-form';
import T from '@/components/shared/i18n-text';
import { testCheckoutMode } from '@/lib/payment-capabilities';

export async function generateMetadata():Promise<Metadata>{const l=supportLanguage('',(await cookies()).get('omnistu_lang')?.value);return{title:REVIEW_COPY[l].title}}

const PlaceOrderPage = async () => {
  if(qualifiedSelectionEnabled()) {const viewer=await auth();if(!viewer?.user?.id)redirect('/sign-in');const user=await getUserById(viewer.user.id);if(!user.address)redirect('/shipping-address');if(user.paymentMethod!==(boundRetailCheckoutEnabled()?'PayPal':'TestPayment'))redirect('/payment-method');return <QualifiedCart checkout cart={await readQualifiedCart(viewer.user.id)}/>;}
  const cart = await getMyCart();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  if (!cart || cart.items.length === 0) redirect('/cart');
  if (!user.address) redirect('/shipping-address');
  if (!user.paymentMethod) redirect('/payment-method');

  // Simulated test checkout: tax and shipping are placeholder estimates, not
  // real rates, and must be labeled as such wherever the summary shows.
  const isSimulatedTestOrder =
    testCheckoutMode() && user.paymentMethod === 'TestPayment';

  const userAddress = user.address as ShippingAddress;
  const addressCopy=CHECKOUT_COPY[supportLanguage('',(await cookies()).get('omnistu_lang')?.value)];

  return (
    <>
      <CheckoutSteps current={3} />
      <h1 className='py-4 text-2xl'><RT name='title'/></h1>
      {isSimulatedTestOrder&&<p role='status' className='rounded-md border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950'><RT name='testOnly'/></p>}
      <div className='grid md:grid-cols-3 md:gap-5'>
        <div className='md:col-span-2 overflow-x-auto space-y-4'>
          <Card>
            <CardContent className='min-w-0 break-words p-4 gap-4'>
              <h2 className='text-xl pb-4'><T k='shippingAddressLabel' /></h2>
              <p>{userAddress.fullName}</p>
              <p>
                {userAddress.streetAddress}, {userAddress.city}{' '}
                {userAddress.state?userAddress.state+', ':''}{userAddress.postalCode}, {userAddress.country}{' '}
              </p>
              {userAddress.phone&&<p className='text-sm'>{addressCopy.phone}: {userAddress.phone}</p>}
              <div className='mt-3'>
                <Link href='/shipping-address'>
                  <Button variant='outline'><T k='editLabel' /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='min-w-0 break-words p-4 gap-4'>
              <h2 className='text-xl pb-4'><T k='paymentMethodLabel' /></h2>
              <p>{isSimulatedTestOrder?<RT name='testMethod'/>:user.paymentMethod}</p>
              <div className='mt-3'>
                <Link href='/payment-method'>
                  <Button variant='outline'><T k='editLabel' /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='min-w-0 break-words p-4 gap-4'>
              <h2 className='text-xl pb-4'><T k='orderItems' /></h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><T k='itemLabel' /></TableHead>
                    <TableHead><T k='quantityLabel' /></TableHead>
                    <TableHead><T k='priceLabel' /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.items.map((item) => (
                    <TableRow key={item.slug}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className='flex items-center'
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          />
                          <span className='px-2'>{item.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className='px-2'>{item.qty}</span>
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.price} USD
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className='p-4 gap-4 space-y-4'>
              <div className='flex justify-between'>
                <div><T k='itemsLabel' /></div>
                <div>{cart.itemsPrice} USD</div>
              </div>
              <div className='flex justify-between'>
                <div><T k='taxLabel' /></div>
                <div>{cart.taxPrice} USD</div>
              </div>
              <div className='flex justify-between'>
                <div><T k='shippingLabel' /></div>
                <div>{cart.shippingPrice} USD</div>
              </div>
              <div className='flex justify-between'>
                <div><T k='totalLabel' /></div>
                <div>{cart.totalPrice} USD</div>
              </div>
              {isSimulatedTestOrder && (
                <div
                  className='rounded-md border border-sky-300 bg-sky-50 px-3 py-2.5 text-xs text-sky-900'
                  data-testid='test-estimates-note'
                >
                  <RT name='testEstimates'/>
                </div>
              )}
              <PlaceOrderForm testOnly={isSimulatedTestOrder}/>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PlaceOrderPage;
