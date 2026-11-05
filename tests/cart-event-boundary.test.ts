import { isCartToastEventDetail } from '@/lib/cart-event';
import { readFileSync } from 'fs';
const valid = {productId:'p',name:'Item',price:'20.00',image:'/product.png',qty:1};
describe('legacy drawer event boundary',()=>{
 test('complete flag-off v1 item event remains supported',()=>{expect(isCartToastEventDetail(valid)).toBe(true);expect(isCartToastEventDetail({...valid,price:20})).toBe(true)});
 test.each([undefined,null,{}, {qty:1},{...valid,name:''},{...valid,productId:''},{...valid,price:''},{...valid,price:'NaN'},{...valid,price:Infinity},{...valid,price:-1},{...valid,qty:0},{...valid,qty:1.5},{...valid,qty:'1'},{...valid,image:undefined}])('rejects malformed detail %#',v=>expect(isCartToastEventDetail(v)).toBe(false));
 test('both legacy consumers validate, never invent qty',()=>{for(const p of ['components/shared/cart/cart-drawer.tsx','components/shared/header/cart-badge.tsx'])expect(readFileSync(p,'utf8')).toContain('isCartToastEventDetail(customEvent.detail)');expect(readFileSync('components/shared/header/cart-badge.tsx','utf8')).not.toContain('qty || 1')});
});
