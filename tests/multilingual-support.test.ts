jest.mock('@/lib/chat',()=>(()=>{const findProducts=jest.fn().mockResolvedValue('');return{findProducts,findProductsState:async(q:string)=>({status:'available',products:await findProducts(q)})}})());
jest.mock('@/lib/actions/product.actions',()=>(()=>{const getAllCategories=jest.fn().mockResolvedValue([]);return{getAllCategories,getAllCategoriesState:async()=>({status:'available',categories:await getAllCategories()})}})());
import {groundedSupportAnswer,supportIntent} from '@/lib/grounded-support';
import {SUPPORT_COPY,SUPPORT_LANGUAGES,requestSupportLanguage,supportLanguage} from '@/lib/support-language';
import {findProducts} from '@/lib/chat';
import {getAllCategories} from '@/lib/actions/product.actions';
const original={...process.env};afterEach(()=>{process.env={...original};jest.clearAllMocks()});
it.each([
 ['मदद चाहिए','contact'],['मेरे ऑर्डर की स्थिति','order'],['रिफंड चाहिए','policy'],['भुगतान कैसे करें','payment'],['डिलीवरी कब होगी','shipping'],['कौन सी श्रेणियाँ हैं','categories'],['नमस्ते','greeting'],
 ['necesito ayuda','contact'],['mi pedido','order'],['un reembolso','policy'],['cómo pagar','payment'],['gastos de envío','shipping'],['categorías','categories'],['hola','greeting'],
 ['besoin d’aide','contact'],['ma commande','order'],['remboursement','policy'],['le paiement','payment'],['frais de livraison','shipping'],['catégories','categories'],['bonjour','greeting'],
 ['ich brauche Hilfe','contact'],['meine Bestellung','order'],['eine Rückgabe','policy'],['wie bezahlen','payment'],['die Versandkosten','shipping'],['Kategorien','categories'],['hallo','greeting'],
 ['サポートに連絡','contact'],['注文を確認','order'],['返品について','policy'],['支払いについて','payment'],['送料について','shipping'],['カテゴリー','categories'],['こんにちは','greeting'],
])('routes %s to %s without product retrieval',(q,intent)=>expect(supportIntent(q)).toBe(intent));
it.each(SUPPORT_LANGUAGES)('all %s help branches preserve explicit limits and valid local links',async lang=>{
 const c=SUPPORT_COPY[lang];expect(Object.values(c).every(s=>s.length>0)).toBe(true);
 Object.assign(process.env,{NODE_ENV:'production',ORDERS_ENABLED:'false',TEST_CHECKOUT_MODE:'false'});
 expect(await groundedSupportAnswer('contact support',lang)).toBe(c.label+'\n'+c.contact);
 expect(await groundedSupportAnswer('refund',lang)).toBe(c.label+'\n'+c.policy);
 expect(await groundedSupportAnswer('track order',lang)).toBe(c.label+'\n'+c.order);
 expect(await groundedSupportAnswer('payment',lang)).toBe(c.label+'\n'+c.closed);
 process.env.TEST_CHECKOUT_MODE='true';expect(await groundedSupportAnswer('payment',lang)).toBe(c.label+'\n'+c.test);
 expect(await groundedSupportAnswer('shipping',lang)).toBe(c.label+'\n'+c.shipping);
 expect(await groundedSupportAnswer('categories',lang)).toBe(c.label+'\n'+c.noCategories);
 expect(await groundedSupportAnswer('hello',lang)).toBe(c.label+'\n'+c.greeting);
 expect(c.contact).toContain('/contact');expect(c.order).toContain('/user/orders');expect(findProducts).not.toHaveBeenCalled();
});
it('Hindi works without a preference cookie and does not leak private order claims',async()=>{
 const a=await groundedSupportAnswer('मेरे ऑर्डर की स्थिति');expect(a).toBe(SUPPORT_COPY.HI.label+'\n'+SUPPORT_COPY.HI.order);expect(findProducts).not.toHaveBeenCalled();
});
it('keeps current product identity and URLs rather than invent translated listings',async()=>{
 (findProducts as jest.Mock).mockResolvedValueOnce('- Shirt | price: $10.00 | link: /product/shirt');const a=await groundedSupportAnswer('shirt','HI');expect(a).toContain(SUPPORT_COPY.HI.matches);expect(a).toContain('/product/shirt');expect(a).toContain(SUPPORT_COPY.HI.productEnd);
});
it('uses current category retrieval with localized framing, no invented stock',async()=>{
 (getAllCategories as jest.Mock).mockResolvedValueOnce([{category:'Apparel',_count:2}]);const a=await groundedSupportAnswer('categories','FR');expect(a).toContain(SUPPORT_COPY.FR.categories);expect(a).toContain('Apparel (2)');
});
it('respects supported preferences and fails safely on malformed cookie values',()=>{
 expect(supportLanguage('hello','ES')).toBe('ES');expect(supportLanguage('hello','invalid')).toBe('EN');expect(supportLanguage('नमस्ते','EN')).toBe('HI');expect(supportLanguage('こんにちは','EN')).toBe('JA');
 expect(requestSupportLanguage(new Request('https://local',{headers:{cookie:'x=1; omnistu_lang=FR; foo=2'}}))).toBe('FR');expect(requestSupportLanguage(new Request('https://local',{headers:{cookie:'omnistu_lang=%ZZ'}}))).toBeUndefined();
});
