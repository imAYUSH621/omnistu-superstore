import {cartLinesMatchCatalog as check, cartTotalsConsistent} from '@/lib/cart-line-integrity';
const products=[{id:'p',price:'20',slug:'shirt'}],line={productId:'p',price:'20.00',slug:'shirt',qty:1};
it('accepts numerically same catalog price',()=>expect(check([line],products)).toBe(true));
it.each([{price:'0.01'},{slug:'forged'},{productId:'gone'},{qty:0},{qty:-1},{qty:1.5},{price:'NaN'}])('rejects forged/stale cart %p',patch=>expect(check([{...line,...patch}],products)).toBe(false));
it('rejects duplicate lines that bypass aggregate stockcheck',()=>expect(check([line,line],products)).toBe(false));

it('rejects persisted underpriced totals without guessing tax policy',()=>{const c={items:[line],itemsPrice:'20',shippingPrice:'0',taxPrice:'0',totalPrice:'20'};expect(cartTotalsConsistent(c)).toBe(true);expect(cartTotalsConsistent({...c,totalPrice:'0.01'})).toBe(false);expect(cartTotalsConsistent({...c,itemsPrice:'0.01',totalPrice:'0.01'})).toBe(false)});
