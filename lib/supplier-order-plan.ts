import {createHash} from 'node:crypto';
import {z} from 'zod';
import {bindRetailLine,assertRetailLineCurrent,type BoundRetailLine} from '@/lib/retail/snapshot';
import type {RetailRawTx} from '@/lib/retail/transactions';
const address=z.object({fullName:z.string().trim().min(1),streetAddress:z.string().trim().min(1),city:z.string().trim().min(1),postalCode:z.string().trim().min(1),country:z.string().regex(/^[A-Z]{2}$/),phone:z.string().trim().regex(/^\+[1-9][0-9]{6,14}$/),state:z.string().trim().min(1)}).passthrough();
type Address=z.infer<typeof address>;
export type SupplierOrderPlan={version:1;orderId:string;userId:string;address:Address;amountCents:number;shippingCents:number;taxCents:number;commercialTermsSource:string;lines:BoundRetailLine[]};
type OrderRow={id:string;userId:string;shippingAddress:unknown;totalPrice:string;itemsPrice:string;shippingPrice:string;taxPrice:string;isPaid:boolean;paymentMethod:string};
function canonical(value:unknown):string{if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';return JSON.stringify(value)}
export const supplierPlanDigest=(p:SupplierOrderPlan)=>createHash('sha256').update(canonical(p)).digest('hex');
function moneyCents(value:string,allowZero=false){if(!/^\d+\.\d{2}$/.test(value))throw Error('Order amount needs review');const n=Number(value.replace('.',''));if(!Number.isSafeInteger(n)||(allowZero?n<0:n<=0))throw Error('Order amount needs review');return n}
/** Bind only independently reloaded, published, current offers. Caller snapshots/hashes
 * are not authority. Transaction caller must already hold its order/cart locks.
 * This records review evidence; it does not enable checkout, spending or dispatch. */
export async function persistSupplierOrderPlanTx(tx:RetailRawTx,input:{orderId:string;userId:string;lines:BoundRetailLine[];now:Date;maxAgeMs:number;commercialTermsSource:string}){
 if(!input.commercialTermsSource.trim())throw Error('Reviewed commercial terms source required');
 const orders=await tx.$queryRaw<OrderRow[]>`SELECT id,"userId","shippingAddress","totalPrice"::text,"itemsPrice"::text,"shippingPrice"::text,"taxPrice"::text,"isPaid","paymentMethod" FROM "Order" WHERE id=${input.orderId}::uuid FOR UPDATE`;
 const order=orders[0];if(orders.length!==1||order.userId!==input.userId||order.isPaid||order.paymentMethod==='TestPayment')throw Error('Unpaid real order required');
 const shipping=address.parse(order.shippingAddress);if(input.lines.length===0||input.lines.length>100)throw Error('Supplier plan needs exact lines');
 const seen=new Set<string>();const lines:BoundRetailLine[]=[];
 for(const line of [...input.lines].sort((a,b)=>a.lineKey.localeCompare(b.lineKey))){
  if(seen.has(line.lineKey))throw Error('Duplicate supplier line');seen.add(line.lineKey);
  const offers=await tx.$queryRaw<{snapshot:unknown;snapshotId:string;availableQty:number}[]>`SELECT snapshot,"snapshotId","availableQty" FROM "RetailOffer" WHERE "lineKey"=${line.lineKey} AND published=true FOR UPDATE`;
  if(offers.length!==1||offers[0].snapshotId!==line.snapshotId||!Number.isSafeInteger(offers[0].availableQty)||offers[0].availableQty<line.qty)throw Error('Approved supplier offer unavailable');
  lines.push(assertRetailLineCurrent(line,offers[0].snapshot,{productId:line.snapshot.productId,variantId:line.snapshot.variantId,destinationCountry:shipping.country,destinationPostal:shipping.postalCode,now:input.now,maxAgeMs:input.maxAgeMs}));
 }
 const items=await tx.$queryRaw<{productId:string;qty:number;price:string}[]>`SELECT "productId",qty,price::text FROM "OrderItem" WHERE "orderId"=${order.id}::uuid ORDER BY "productId"`;
 if(items.length!==lines.length||new Set(lines.map(l=>l.snapshot.productId)).size!==lines.length||items.some(i=>!lines.some(l=>l.snapshot.productId===i.productId&&l.qty===i.qty&&l.snapshot.retailUnitCents===moneyCents(i.price))))throw Error('Order item does not match exact approved supplier line');
 const amountCents=moneyCents(order.totalPrice),shippingCents=moneyCents(order.shippingPrice,true),taxCents=moneyCents(order.taxPrice,true);const sum=lines.reduce((n,l)=>n+l.qty*l.snapshot.retailUnitCents,0);if(!Number.isSafeInteger(sum)||sum!==moneyCents(order.itemsPrice)||sum+shippingCents+taxCents!==amountCents)throw Error('Approved offer total does not match order');
 const plan:SupplierOrderPlan={version:1,orderId:order.id,userId:order.userId,address:shipping,amountCents,shippingCents,taxCents,commercialTermsSource:input.commercialTermsSource,lines};const planDigest=supplierPlanDigest(plan);
 const prior=await tx.$queryRaw<{digest:string;plan:SupplierOrderPlan}[]>`SELECT digest,plan FROM "OrderSupplierPlan" WHERE "orderId"=${order.id}::uuid`;
 if(prior.length){if(prior.length!==1||prior[0].digest!==planDigest||supplierPlanDigest(prior[0].plan)!==planDigest)throw Error('Supplier plan already bound differently');return{plan:prior[0].plan,digest:planDigest,replayed:true}}
 await tx.$executeRaw`INSERT INTO "OrderSupplierPlan" ("orderId",digest,plan) VALUES (${order.id}::uuid,${planDigest},${JSON.stringify(plan)}::jsonb)`;
 return{plan,digest:planDigest,replayed:false};
}
/** The same persisted record is the source for payment review and both dispatch entry
 * points. Historical unbound orders remain untouched and require review, never backfill. */
export async function loadSupplierOrderPlanTx(tx:RetailRawTx,input:{orderId:string;requirePaid:boolean;now:Date;maxAgeMs:number}){
 const orders=await tx.$queryRaw<OrderRow[]>`SELECT id,"userId","shippingAddress","totalPrice"::text,"itemsPrice"::text,"shippingPrice"::text,"taxPrice"::text,"isPaid","paymentMethod" FROM "Order" WHERE id=${input.orderId}::uuid FOR UPDATE`;
 const o=orders[0];if(orders.length!==1||o.paymentMethod==='TestPayment'||(input.requirePaid&&!o.isPaid))throw Error('Real order state requires review');
 const rows=await tx.$queryRaw<{digest:string;plan:SupplierOrderPlan}[]>`SELECT digest,plan FROM "OrderSupplierPlan" WHERE "orderId"=${o.id}::uuid`;
 if(rows.length!==1||supplierPlanDigest(rows[0].plan)!==rows[0].digest)throw Error('Persisted supplier binding required');
 const p=rows[0].plan;if(p.version!==1||p.orderId!==o.id||p.userId!==o.userId||p.amountCents!==moneyCents(o.totalPrice)||(p.shippingCents??0)!==moneyCents(o.shippingPrice,true)||(p.taxCents??0)!==moneyCents(o.taxPrice,true)||canonical(address.parse(o.shippingAddress))!==canonical(p.address))throw Error('Order changed after supplier approval');
 if(!Array.isArray(p.lines)||!p.lines.length)throw Error('Missing supplier lines');
 const items=await tx.$queryRaw<{productId:string;qty:number;price:string}[]>`SELECT "productId",qty,price::text FROM "OrderItem" WHERE "orderId"=${o.id}::uuid ORDER BY "productId"`;
 if(items.length!==p.lines.length||new Set(p.lines.map(l=>l.snapshot.productId)).size!==p.lines.length||items.some(i=>!p.lines.some(l=>l.snapshot.productId===i.productId&&l.qty===i.qty&&l.snapshot.retailUnitCents===moneyCents(i.price)))||p.lines.reduce((n,l)=>n+l.qty*l.snapshot.retailUnitCents,0)!==moneyCents(o.itemsPrice)||p.lines.reduce((n,l)=>n+l.qty*l.snapshot.retailUnitCents,0)+(p.shippingCents??0)+(p.taxCents??0)!==p.amountCents)throw Error('Order items changed after supplier approval');
 for(const l of p.lines){const b=bindRetailLine(l.snapshot,l.qty,input.now,input.maxAgeMs);if(b.snapshotId!==l.snapshotId||b.lineKey!==l.lineKey||b.snapshot.destinationCountry!==p.address.country||b.snapshot.destinationPostal!==p.address.postalCode)throw Error('Supplier quote needs review')}
 return p;
}

/** No provider call. Pre-payment and dispatch reuse the persisted allocation. */
export async function validateSupplierPaymentPlanTx(tx:RetailRawTx,input:{orderId:string;now:Date;maxAgeMs:number}){
 const plan=await loadSupplierOrderPlanTx(tx,{...input,requirePaid:false});
 const rows=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${input.orderId}::uuid ORDER BY "lineKey" FOR UPDATE`;
 if(rows.length!==plan.lines.length||rows.some(r=>r.state!=='HELD'||!plan.lines.some(l=>l.lineKey===r.lineKey&&l.qty===r.qty)))throw Error('Exact supplier allocation required before payment');
 return plan;
}
export async function consumeSupplierAllocationTx(tx:RetailRawTx,input:{orderId:string;now:Date;maxAgeMs:number}){
 const plan=await validateSupplierPaymentPlanTx(tx,input);
 const changed=await tx.$executeRaw`UPDATE "OrderSupplierAllocation" SET state='CONSUMED' WHERE "orderId"=${input.orderId}::uuid AND state='HELD'`;
 if(changed!==plan.lines.length)throw Error('Supplier allocation changed during settlement');return plan;
}
export function requiresSupplierOrderPlan(order:{paymentNote?:string|null;paymentMethod:string;paymentResult?:unknown},env:NodeJS.ProcessEnv=process.env){
 if(order.paymentMethod==='TestPayment')return false;
 const stored=order.paymentResult as {paypalEnv?:unknown}|null;
 return order.paymentNote?.includes('SUPPLIER_BOUND_PREPARATION')===true||env.NODE_ENV==='production'&&env.TEST_CHECKOUT_MODE!=='true'||stored?.paypalEnv==='live';
}
