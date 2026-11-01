import React from 'react';
import T from '@/components/shared/i18n-text';
import { cn } from '@/lib/utils';

const CheckoutSteps = ({ current = 0 }) => {
  return (
    <div className='flex-between flex-col md:flex-row space-x-2 space-y-2 mb-10'>
      {(
        [
          ['userLoginLabel', 'User Login'],
          ['shippingAddressLabel', 'Shipping Address'],
          ['paymentMethodLabel', 'Payment Method'],
          ['placeOrder', 'Place Order'],
        ] as const
      ).map(([stepKey, step], index) => (
          <React.Fragment key={step}>
            <div
              className={cn(
                'p-2 w-56 rounded-full text-center text-sm',
                index === current ? 'bg-secondary' : ''
              )}
            >
              <T k={stepKey} />
            </div>
            {step !== 'Place Order' && (
              <hr className='w-16 border-t border-gray-300 mx-2' />
            )}
          </React.Fragment>
        )
      )}
    </div>
  );
};

export default CheckoutSteps;
