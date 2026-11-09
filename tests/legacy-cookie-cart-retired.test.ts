import {GET,POST,DELETE} from '@/app/api/cart/route';
import {readFileSync} from 'node:fs';
import path from 'node:path';
it.each([['GET',GET],['POST',POST],['DELETE',DELETE]] as const)('%s refuses to imply Store-cart success',async(method,handler)=>{
 const response=await handler();expect(response.status).toBe(410);expect(response.headers.get('cache-control')).toBe('no-store');const body=await response.json();expect(body).toEqual({success:false,error:'LEGACY_CART_RETIRED',message:expect.any(String),cartUrl:'/cart'});expect(body).not.toHaveProperty('items');expect(body).not.toHaveProperty('count');expect(JSON.stringify(body)).not.toContain('19.99');
 const cookie=response.headers.get('set-cookie');if(method==='DELETE'){expect(cookie).toContain('omnistu_cart=');expect(cookie).toContain('Max-Age=0');expect(cookie).not.toContain('sessionCartId');expect(cookie).not.toContain('authjs');}else expect(cookie).toBeNull();
});
it('does not parse caller prices, cookie contents or write a persisted cart',()=>{const source=readFileSync(path.join(process.cwd(),'app/api/cart/route.ts'),'utf8');for(const forbidden of['next/headers','req.json','JSON.parse','prisma','addItemToCart','addQualifiedItem'])expect(source).not.toContain(forbidden)});
it('published crawl contract no longer advertises synthetic cart operations',()=>{const graph=JSON.parse(readFileSync(path.join(process.cwd(),'public/data/CRAWL_GRAPH.json'),'utf8'));const c=graph.rest_api_contracts.find((v:{endpoint:string})=>v.endpoint==='/api/cart');expect(c.status).toBe('retired');expect(c.http_status).toBe(410);expect(c.cart_url).toBe('/cart');expect(c).not.toHaveProperty('payload_example');expect(c.response_schema.success).toBe('false')});
