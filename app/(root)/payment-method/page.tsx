import { Metadata } from 'next';
import{cookies}from 'next/headers';
import{supportLanguage}from '@/lib/support-language';
import{CHECKOUT_COPY}from '@/lib/checkout-language';
import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';
import { getPaymentMethodStatuses, testCheckoutMode } from '@/lib/payment-capabilities';
import PaymentMethodForm from './payment-method-form';
import CT from '@/components/shared/checkout-text';
import CheckoutSteps from '@/components/shared/checkout-steps';

export async function generateMetadata():Promise<Metadata>{const l=supportLanguage('',(await cookies()).get('omnistu_lang')?.value);return{title:CHECKOUT_COPY[l].paymentTitle}}

const PaymentMethodPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not found');

  const user = await getUserById(userId);

  return (
    <>
      <CheckoutSteps current={2} />
      {testCheckoutMode() && (
        <div className='rounded-md border border-sky-300 bg-sky-50 px-3 py-2.5 text-xs text-sky-900 my-3' data-testid='test-checkout-banner'>
          <CT name='testOnly'/>
        </div>
      )}
      <PaymentMethodForm preferredPaymentMethod={user.paymentMethod} methods={getPaymentMethodStatuses()} />
    </>
  );
};

export default PaymentMethodPage;
