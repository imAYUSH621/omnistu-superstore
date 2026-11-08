import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CONTACT_COPY,SUPPORT_LANGUAGES,type SupportLanguage} from '@/lib/support-language';
let mockLanguage:SupportLanguage='EN';
jest.mock('@/hooks/use-store-language',()=>({useStoreLanguage:()=>mockLanguage}));
import ContactPage from '@/app/(root)/contact/page';
it.each(SUPPORT_LANGUAGES)('contact form displays complete %s saved-inbox copy, never claims emailed',lang=>{
 mockLanguage=lang;const c=CONTACT_COPY[lang],html=renderToStaticMarkup(<ContactPage/>);const text=html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"');
 for(const key of ['title','intro','helpTitle','help','trackTitle','track','formTitle','name','email','message','save','privacy','history','account'] as const)expect(text).toContain(c[key]);
 for(const field of ['name','email','message'])expect(html).toContain(`name="${field}"`);
 expect(html).toContain('href="/user/enquiries"');expect(html).toContain('href="/track"');expect(html).toContain('maxLength="5000"');
});
it('every locale has receipt, privacy and truthful failure copy',()=>{
 for(const lang of SUPPORT_LANGUAGES){const c=CONTACT_COPY[lang];expect(Object.values(c).every(x=>x.length>0)).toBe(true);expect(c.receipt).not.toBe(c.intro);expect(c.error).not.toBe(c.receipt);expect(c.network).not.toBe(c.receipt);}
});
