import React from 'react';
import{renderToStaticMarkup}from 'react-dom/server';
import{HEADER_COPY,headerDisclosure,headerItemCount}from '@/lib/header-language';
import{readFileSync}from 'fs';
import type{SupportLanguage}from '@/lib/support-language';
let language:SupportLanguage='EN';
jest.mock('@/hooks/use-store-language',()=>({useStoreLanguage:()=>language}));
jest.mock('next/navigation',()=>({usePathname:()=>'/services'}));
jest.mock('next/link',()=>({__esModule:true,default:({children,...props}:React.ComponentProps<'a'>)=><a {...props}>{children}</a>}));
jest.mock('next-themes',()=>({useTheme:()=>({theme:'light',setTheme:jest.fn()})}));
// Select portal replaced only for this renderer fixture; real Radix selection needs hosted browser proof.
jest.mock('@/components/ui/select',()=>({Select:({children,name,defaultValue}:any)=><div data-name={name} data-default={defaultValue}>{children}</div>,SelectContent:({children}:any)=><div>{children}</div>,SelectItem:({children,value}:any)=><span data-value={value}>{children}</span>,SelectTrigger:({children}:any)=><button>{children}</button>,SelectValue:({placeholder}:any)=><span>{placeholder}</span>}));
jest.mock('@/components/shared/localized-price',()=>({SUPPORTED_CURRENCY_CODES:['USD','INR','EUR','GBP','CAD','AUD','JPY'],loadRatesInfo:jest.fn(async()=>null)}));
jest.mock('@/lib/actions/product.actions',()=>({getAllCategories:jest.fn(async()=>[{category:'Custom Apparel',_count:2}])}));
import SiteSwitch from '@/components/shared/header/site-switch';
import HeaderText from '@/components/shared/header/header-text';
import Search from '@/components/shared/header/search';
import CategoryDrawer from '@/components/shared/header/category-drawer';
import CartBadge from '@/components/shared/header/cart-badge';
import GlobalSelector from '@/components/shared/header/global-selector';
const langs=Object.keys(HEADER_COPY)as SupportLanguage[];
describe('shared global navigation locale contract (renderer only, not browser proof)',()=>{
 for(const l of langs){
  it(l+' has complete text/disclosure without full translation or local-settlement claims',()=>{
   const c=HEADER_COPY[l];expect(Object.keys(c).sort()).toEqual(Object.keys(HEADER_COPY.EN).sort());for(const s of Object.values(c))expect(typeof s==='string'&&s.trim().length>0).toBe(true);
   expect(headerDisclosure(l,true)).toContain(c.rateLive);expect(headerDisclosure(l,false)).toContain(c.rateReference);for(const live of[true,false])expect(headerDisclosure(l,live)).toContain('USD');expect(headerDisclosure(l,false)).not.toContain(c.rateLive);
  });
  it(l+' switch localizes labels and keeps exact routes/current section',()=>{
   language=l;const html=renderToStaticMarkup(<SiteSwitch/>);for(const s of[HEADER_COPY[l].products,HEADER_COPY[l].services,HEADER_COPY[l].sections])expect(html).toContain(s.replace(/&/g,'&amp;'));expect(html).toContain('href="/services" aria-current="page"');expect(html).toContain('href="/"');expect(html).not.toContain('href="/servicesx"');
  });
  it(l+' search and drawer keep canonical category values/URLs while translating visible controls',async()=>{
   language=l;const html=renderToStaticMarkup(await Search());expect(html).toContain('method="GET"');expect(html).toContain('action="/search"');expect(html).toContain(HEADER_COPY[l].search);expect(html).toContain(HEADER_COPY[l].allCategories);expect(html).toContain('data-value="Custom Apparel"');expect(html).toContain('data-default="all"');const drawer=renderToStaticMarkup(await CategoryDrawer());expect(drawer).toContain(HEADER_COPY[l].allCategories);
  });
  it(l+' cart accessible count is localized without changing cart state',()=>{
   language=l;const html=renderToStaticMarkup(<CartBadge initialCount={3}/>);expect(html).toContain(headerItemCount(3,l));expect(html).toContain(HEADER_COPY[l].cart);expect(html).toContain('href="/cart"');expect(html).toContain('id="nav-cart-count"');expect(headerItemCount(-1,l)).toEqual(headerItemCount(0,l));
  });
  it(l+' locale chooser accessible name follows the existing hook',()=>{
   language=l;const html=renderToStaticMarkup(<GlobalSelector/>);expect(html).toContain(HEADER_COPY[l].localeChoose);expect(html).toContain(l+'/USD');
  });
  it(l+' names remain escaped data, never translated HTML or identity claims',()=>{
   language=l;const html=renderToStaticMarkup(<HeaderText value={'<img src=x onerror=alert(1)>'}/>);expect(html).toContain(HEADER_COPY[l].hello);expect(html).toContain('&lt;img');expect(html).not.toContain('<img');expect(renderToStaticMarkup(<HeaderText count={2}/>)).toContain(headerItemCount(2,l));
  });
 }
 it('long translated chrome uses the existing second search row below1536px and bounded orders label',()=>{const h=readFileSync('components/shared/header/index.tsx','utf8');expect(h).toContain('hidden 2xl:inline-grid');expect(h).toContain('hidden 2xl:flex flex-1 min-w-0');expect(h).toContain('2xl:hidden px-3');expect(h).toContain('xl:w-[290px]');expect(readFileSync('components/shared/header/menu.tsx','utf8')).toContain('max-w-[180px] whitespace-normal');});
 it('same global event synchronizes both currency selector instances; no new auth/payment/supplier path',()=>{
  const s=readFileSync('components/shared/header/global-selector.tsx','utf8');expect(s).toContain("window.addEventListener('omnistu:currency-change',onCurrency)");expect(s).toContain("window.removeEventListener('omnistu:currency-change',onCurrency)");expect(s).toContain("window.dispatchEvent(new CustomEvent('omnistu:lang-change'");expect(s).toContain('useStoreLanguage()');expect(s).not.toContain('setSelectedLang');
  for(const p of['site-switch.tsx','header-text.tsx','global-selector.tsx','mode-toggle.tsx'])expect(readFileSync('components/shared/header/'+p,'utf8')).not.toMatch(/signIn\(|createOrder|supplier|grantMembership|POST/);
 });
});
