import { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';
import { getPaymentMethodStatuses, testCheckoutMode } from '@/lib/payment-capabilities';
import PaymentMethodForm from './payment-method-form';
import CheckoutSteps from '@/components/shared/checkout-steps';

export const metadata: Metadata = {
  title: 'Select Payment Method',
};

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
          TEST MODE: checkout is simulated - no real payment is charged and no real order is placed with any supplier.
        </div>
      )}
      <PaymentMethodForm preferredPaymentMethod={user.paymentMethod} methods={getPaymentMethodStatuses()} />
    </>
  );
};

export default PaymentMethodPage;
