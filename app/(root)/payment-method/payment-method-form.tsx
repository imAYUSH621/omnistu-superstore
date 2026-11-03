'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { paymentMethodSchema } from '@/lib/validators';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_PAYMENT_METHOD } from '@/lib/constants';
import type { PaymentMethodStatus } from '@/lib/payment-capabilities';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateUserPaymentMethod } from '@/lib/actions/user.actions';
import T from '@/components/shared/i18n-text';

const PaymentMethodForm = ({
  preferredPaymentMethod,
  methods,
}: {
  preferredPaymentMethod: string | null;
  methods: PaymentMethodStatus[];
}) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: (() => {
        const on = methods.filter((m) => m.enabled).map((m) => m.method);
        const want = preferredPaymentMethod || DEFAULT_PAYMENT_METHOD;
        return on.includes(want) ? want : on[0] ?? '';
      })(),
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    startTransition(async () => {
      const res = await updateUserPaymentMethod(values);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      router.push('/place-order');
    });
  };

  return (
    <>
      <div className='max-w-md mx-auto space-y-4'>
        <h1 className='h2-bold mt-4'><T k='paymentMethod' /></h1>
        <p className='text-sm text-muted-foreground'>
          Please select a payment method
        </p>
        <Form {...form}>
          <form
            method='post'
            className='space-y-4'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className='flex flex-col md:flex-row gap-5'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        className='flex flex-col space-y-2'
                      >
                        {methods.map((m) => { const paymentMethod = m.method; return (
                          <FormItem
                            key={paymentMethod}
                            className='flex items-center space-x-3 space-y-0'
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={paymentMethod}
                                disabled={!m.enabled}
                                checked={field.value === paymentMethod}
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {paymentMethod === 'TestPayment' ? 'Test payment (SIMULATED - no real charge)' : paymentMethod}
                              {!m.enabled && (
                                <span className='ml-2 text-xs text-muted-foreground' data-testid='method-unavailable'>
                                  ({m.reason ?? 'Not available yet'})
                                </span>
                              )}
                            </FormLabel>
                          </FormItem>
                        ); })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!methods.some((m) => m.enabled) && (
              <p className='text-sm text-destructive' data-testid='no-payment-methods'>
                No payment method is available yet, so checkout is paused.
              </p>
            )}
            <div className='flex gap-2'>
              <Button type='submit' disabled={isPending || !methods.some((m) => m.enabled)}>
                {isPending ? (
                  <Loader className='w-4 h-4 animate-spin' />
                ) : (
                  <ArrowRight className='w-4 h-4' />
                )}{' '}
                <T k='continueLabel' />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default PaymentMethodForm;
