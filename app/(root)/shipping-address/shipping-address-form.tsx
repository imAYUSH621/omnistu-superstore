'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useTransition } from 'react';
import { ShippingAddress } from '@/types';
import { shippingAddressSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { ControllerRenderProps, useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader } from 'lucide-react';
import { updateUserAddress } from '@/lib/actions/user.actions';
import { shippingAddressDefaultValues } from '@/lib/constants';
import T from '@/components/shared/i18n-text';
import{CheckoutError}from '@/components/shared/checkout-text';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{CHECKOUT_COPY,checkoutError}from '@/lib/checkout-language';
import CheckoutPendingNote from '@/components/shared/checkout-pending-note';

const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {
  const language=useStoreLanguage();const t=CHECKOUT_COPY[language];
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof shippingAddressSchema>>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {...shippingAddressDefaultValues,...address},
  });

  const [isPending, startTransition] = useTransition();

  // Warm the next step's RSC payload + function while the user types;
  // GET-only read of the viewer's own data, no writes (D12).
  useEffect(() => {
    router.prefetch('/payment-method');
  }, [router]);

  const onSubmit: SubmitHandler<z.infer<typeof shippingAddressSchema>> = async (
    values
  ) => {
    startTransition(async () => {
      const res = await updateUserAddress(values);

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: checkoutError(res.message,language),
        });
        return;
      }

      router.push('/payment-method');
    });
  };

  return (
    <>
      <div className='w-full max-w-md mx-auto space-y-4 px-4 break-words'>
        <h1 className='h2-bold mt-4'>{t.addressTitle}</h1>
        <p className='text-sm text-muted-foreground'>
          <T k='shippingAddressSubtitle' />
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
                name='fullName'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'fullName'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel>{t.name}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.namePlaceholder} {...field} />
                    </FormControl>
                    <CheckoutError/>
                  </FormItem>
                )}
              />
            </div>
            <div className='flex flex-col md:flex-row gap-5'>
              <FormField
                control={form.control}
                name='streetAddress'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'streetAddress'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel>{t.street}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.streetPlaceholder} {...field} />
                    </FormControl>
                    <CheckoutError/>
                  </FormItem>
                )}
              />
            </div>
            <div className='flex flex-col md:flex-row gap-5'>
              <FormField
                control={form.control}
                name='city'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'city'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel>{t.city}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.cityPlaceholder} {...field} />
                    </FormControl>
                    <CheckoutError/>
                  </FormItem>
                )}
              />
            </div>
            <div className='flex flex-col md:flex-row gap-5'>
              <FormField
                control={form.control}
                name='postalCode'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'postalCode'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel>{t.postal}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.postalPlaceholder} {...field} />
                    </FormControl>
                    <CheckoutError/>
                  </FormItem>
                )}
              />
            </div>
            <div className='flex flex-col md:flex-row gap-5'>
              <FormField
                control={form.control}
                name='country'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    z.infer<typeof shippingAddressSchema>,
                    'country'
                  >;
                }) => (
                  <FormItem className='w-full'>
                    <FormLabel>{t.country}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.countryPlaceholder} {...field} />
                    </FormControl>
                    <CheckoutError/>
                  </FormItem>
                )}
              />
            </div>
            <div className='flex flex-col gap-5'>
              <FormField control={form.control} name='state' render={({field})=>(
                <FormItem className='w-full'><FormLabel>{t.state}</FormLabel><FormControl>
                  <Input {...field} value={field.value||''} autoComplete='address-level1' placeholder={t.statePlaceholder}/>
                </FormControl><CheckoutError/></FormItem>
              )}/>
              <FormField control={form.control} name='phone' render={({field})=>(
                <FormItem className='w-full'><FormLabel>{t.phone}</FormLabel><FormControl>
                  <Input {...field} value={field.value||''} type='tel' autoComplete='tel' inputMode='tel' placeholder={t.phonePlaceholder} aria-describedby='delivery-phone-note'/>
                </FormControl><p id='delivery-phone-note' className='text-sm text-muted-foreground'>{t.deliveryPhoneNote}</p><CheckoutError/></FormItem>
              )}/>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button type='submit' disabled={isPending}>
                {isPending ? (
                  <Loader className='w-4 h-4 animate-spin' />
                ) : (
                  <ArrowRight className='w-4 h-4' />
                )}{' '}
                {t.continue}
              </Button>
              <CheckoutPendingNote
                show={isPending}
                label={t.savingAddress}
              />
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default ShippingAddressForm;
