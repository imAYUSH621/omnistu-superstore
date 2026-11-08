'use client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useTransition } from 'react';
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
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateUserPaymentMethod } from '@/lib/actions/user.actions';
import{CheckoutError}from '@/components/shared/checkout-text';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{CHECKOUT_COPY,checkoutError}from '@/lib/checkout-language';
import CheckoutPendingNote from '@/components/shared/checkout-pending-note';

const PaymentMethodForm = ({
  preferredPaymentMethod,
  methods,
}: {
  preferredPaymentMethod: string | null;
  methods: PaymentMethodStatus[];
}) => {
  const language=useStoreLanguage();const t=CHECKOUT_COPY[language];
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

  // Warm the next step's RSC payload + function while the user picks a
  // method; GET-only read of the viewer's own data, no writes (D12).
  useEffect(() => {
    router.prefetch('/place-order');
  }, [router]);

  const onSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    startTransition(async () => {
      const res = await updateUserPaymentMethod(values);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: checkoutError(res.message,language),
        });
        return;
      }

      router.push('/place-order');
    });
  };

  return (
    <>
      <div className='w-full max-w-md mx-auto space-y-4 px-4 break-words'>
        <h1 className='h2-bold mt-4'>{t.paymentTitle}</h1>
        <p className='text-sm text-muted-foreground'>
          {t.selectPayment}
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
                        value={field.value}
                        onValueChange={field.onChange}
                        className='flex flex-col space-y-2'
                      >
                        {methods.map((m) => { const paymentMethod = m.method; return (
                          <FormItem
                            key={paymentMethod}
                            className='min-w-0 flex items-start space-x-3 space-y-0'
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={paymentMethod}
                                disabled={!m.enabled}
                                checked={field.value === paymentMethod}
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {paymentMethod === 'TestPayment' ? t.testMethod : paymentMethod}
                              {!m.enabled && (
                                <span className='ml-2 text-xs text-muted-foreground' data-testid='method-unavailable'>
                                  ({t.unavailableMethod})
                                </span>
                              )}
                            </FormLabel>
                          </FormItem>
                        ); })}
                      </RadioGroup>
                    </FormControl>
                    <CheckoutError/>
                  </FormItem>
                )}
              />
            </div>

            {!methods.some((m) => m.enabled) && (
              <p className='text-sm text-destructive' data-testid='no-payment-methods'>
                {t.paused}
              </p>
            )}
            <div className='flex flex-wrap gap-2'>
              <Button type='submit' disabled={isPending || !methods.some((m) => m.enabled)}>
                {isPending ? (
                  <Loader className='w-4 h-4 animate-spin' />
                ) : (
                  <ArrowRight className='w-4 h-4' />
                )}{' '}
                {t.continue}
              </Button>
              <CheckoutPendingNote
                show={isPending}
                label={t.savingPayment}
              />
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default PaymentMethodForm;
