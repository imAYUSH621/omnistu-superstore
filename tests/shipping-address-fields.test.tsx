import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {shippingAddressSchema} from '@/lib/validators';
import {CHECKOUT_COPY,checkoutError} from '@/lib/checkout-language';
import type {SupportLanguage} from '@/lib/support-language';
let mockLanguage:SupportLanguage='EN';
jest.mock('@/hooks/use-store-language',()=>({useStoreLanguage:()=>mockLanguage}));
jest.mock('next/navigation',()=>({useRouter:()=>({push:jest.fn(),prefetch:jest.fn()})}));
jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast:jest.fn()})}));
jest.mock('@/lib/actions/user.actions',()=>({updateUserAddress:jest.fn()}));
jest.mock('@/components/shared/i18n-text',()=>({__esModule:true,default:()=> <span>Choose the delivery address for this order.</span>}));
import Address from '@/app/(root)/shipping-address/shipping-address-form';
const old={fullName:'Synthetic Customer',streetAddress:'Fixture street',city:'Fixture city',postalCode:'10001',country:'US'};
it('preserves legacy saved addresses while validating supplied supplier phone and state fields',()=>{
 expect(shippingAddressSchema.safeParse(old).success).toBe(true);
 expect(shippingAddressSchema.parse({...old,phone:'+14155552671',state:' New York '})).toMatchObject({phone:'+14155552671',state:'New York'});
 for(const phone of ['5551234','+1 (415) 555-2671','abc','+0123456789'])expect(shippingAddressSchema.safeParse({...old,phone}).success).toBe(false);
 expect(shippingAddressSchema.safeParse({...old,state:'a'.repeat(101)}).success).toBe(false);
});
for(const lang of Object.keys(CHECKOUT_COPY)as SupportLanguage[])it(lang+' actual form exposes saved delivery fields without fake defaults',()=>{
 mockLanguage=lang;const saved={...old,phone:'+14155552671',state:'New York'},html=renderToStaticMarkup(<Address address={saved}/>);const t=CHECKOUT_COPY[lang];
 expect(html).toContain(t.phone);expect(html).toContain(t.state);expect(html).toContain('value="+14155552671"');expect(html).toContain('value="New York"');expect(html).toContain('autoComplete="tel"');
 expect(checkoutError('Use an international phone number, starting with + and the country code',lang)).toBe(t.phoneInvalid);
 const legacy=renderToStaticMarkup(<Address address={old}/>);expect(legacy).not.toContain('value="+14155552671"');expect(legacy).not.toContain('value="New York"');
 if(process.env.ADDRESS_VISUAL_OUTPUT_DIR&&['EN','HI'].includes(lang))require('fs').writeFileSync(process.env.ADDRESS_VISUAL_OUTPUT_DIR+'/address-'+lang+'.html','<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/address.css"></head><body class="bg-background text-foreground"><main class="mx-auto max-w-xl py-6">'+html+'</main></body></html>');
});
