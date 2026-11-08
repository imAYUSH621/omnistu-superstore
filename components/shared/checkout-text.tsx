'use client';
import{useFormField}from '@/components/ui/form';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{CHECKOUT_COPY,type CheckoutKey,checkoutError}from '@/lib/checkout-language';
export default function CheckoutText({name}:{name:CheckoutKey}){const l=useStoreLanguage();return <span lang={l.toLowerCase()}>{CHECKOUT_COPY[l][name]}</span>}
export function CheckoutError(){const l=useStoreLanguage();const{error,formMessageId}=useFormField();if(!error)return null;return <p id={formMessageId} className='text-sm font-medium text-destructive'>{checkoutError(String(error.message??''),l)}</p>}

