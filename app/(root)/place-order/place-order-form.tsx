'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/actions/order.actions';
import { useToast } from '@/hooks/use-toast';
import T from '@/components/shared/i18n-text';

const PlaceOrderForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  // One idempotency key per mounted form: retries and accidental double
  // submits reuse it, so the server returns the original order (D11).
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await createOrder(idempotencyKey.current);

      if (res.redirectTo) {
        router.push(res.redirectTo);
        return;
      }
      // No redirect means a validation failure before insert: surface the
      // reason (it was previously silent) and allow a retry with a fresh key
      // after the user fixes the issue.
      toast({
        variant: 'destructive',
        description: res.message || 'Could not place the order. Please try again.',
      });
      idempotencyKey.current = crypto.randomUUID();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='w-full'>
      <Button disabled={pending} className='w-full' type='submit'>
        {pending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Check className='w-4 h-4' />
        )}{' '}
        <T k='placeOrder' />
      </Button>
    </form>
  );
};

export default PlaceOrderForm;
