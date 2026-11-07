import {createHash} from 'node:crypto';
import {prisma} from '@/db/prisma';
import type {Prisma} from '@prisma/client';
import {bindRetailLine,assertRetailLineCurrent,type BoundRetailLine} from './snapshot';
export type RetailRawTx={
 $queryRaw:<T=unknown>(query:TemplateStringsArray,...values:unknown[])=>Promise<T>;
 $executeRaw:(query:TemplateStringsArray,...values:unknown[])=>Promise<unknown>;
};
type CartLineInput={validatePrepared?:(tx:RetailRawTx,line:BoundRetailLine)=>Promise<void>;expectedSnapshotId?:string;userId:string;cartId?:string;lineKey:string;qty:number;now:Date;maxAgeMs:number;destinationCountry:string;destinationPostal:string};
/** Tx body shared by the local composer and the hosted preview executor. */
export async function addStoredRetailCartLineTx(tx:RetailRawTx,input:CartLineInput):Promise<string>{
 return (async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`retail-cart:${input.userId}`}))`;
  const offers=await tx.$queryRaw<{snapshot:unknown;snapshotId:string;availableQty:number}[]>`SELECT snapshot,"snapshotId","availableQty" FROM "RetailOffer" WHERE published=true AND "lineKey"=${input.lineKey} FOR UPDATE`;if(offers.length!==1)throw Error('Offer unavailable');
  if(!Number.isSafeInteger(offers[0].availableQty)||offers[0].availableQty<input.qty)throw Error('Offer unavailable');
  if(input.expectedSnapshotId!==undefined&&offers[0].snapshotId!==input.expectedSnapshotId)throw Error('Quote changed again - review again');
  const line=bindRetailLine(offers[0].snapshot,input.qty,input.now,input.maxAgeMs);
  if(line.snapshotId!==offers[0].snapshotId||line.lineKey!==input.lineKey||line.snapshot.destinationCountry!==input.destinationCountry||line.snapshot.destinationPostal!==input.destinationPostal)throw Error('Destination changed');
  if(input.validatePrepared)await input.validatePrepared(tx,line);
  // The caller's pre-lock cart lookup is only a hint. Two initial requests can
  // both see no cart; resolve again under the per-owner lock before creating.
  let cartId=input.cartId;
  if(!cartId){const existing=await tx.$queryRaw<{id:string}[]>`SELECT id FROM "RetailCart" WHERE "userId"=${input.userId}::uuid AND "destinationCountry"=${input.destinationCountry} AND "destinationPostal"=${input.destinationPostal} ORDER BY id LIMIT 2 FOR UPDATE`;if(existing.length>1)throw Error('Cart requires review');cartId=existing[0]?.id;}
  if(!cartId){const r=await tx.$queryRaw<{id:string}[]>`INSERT INTO "RetailCart" ("userId",lines,"destinationCountry","destinationPostal") VALUES (${input.userId}::uuid,${JSON.stringify([line])}::jsonb,${input.destinationCountry},${input.destinationPostal}) RETURNING id`;return r[0].id}
  const rows=await tx.$queryRaw<{lines:BoundRetailLine[];destinationCountry:string;destinationPostal:string}[]>`SELECT lines,"destinationCountry","destinationPostal" FROM "RetailCart" WHERE id=${cartId}::uuid AND "userId"=${input.userId}::uuid FOR UPDATE`;const cart=rows[0];if(!cart||cart.destinationCountry!==input.destinationCountry||cart.destinationPostal!==input.destinationPostal)throw Error('Cart unavailable');
  if(cart.lines.some(l=>l.lineKey===line.lineKey))throw Error('Requote exact quantity before changing line');
  await tx.$executeRaw`UPDATE "RetailCart" SET lines=${JSON.stringify([...cart.lines,line])}::jsonb WHERE id=${cartId}::uuid`;return cartId;
 })(tx);
}
export function retailCartReviewToken(cart:{lines:BoundRetailLine[];destinationCountry:string;destinationPostal:string}){return createHash('sha256').update(JSON.stringify({country:cart.destinationCountry,postal:cart.destinationPostal,lines:cart.lines.map(l=>({lineKey:l.lineKey,snapshotId:l.snapshotId,qty:l.qty})).sort((a,b)=>a.lineKey.localeCompare(b.lineKey))})).digest('hex')}
type SimulationOrderInput={displayLines:Prisma.InputJsonValue;userId:string;cartId:string;now:Date;maxAgeMs:number;shippingAddress:Prisma.InputJsonValue;expectedReviewToken:string;validatePrepared?:(tx:RetailRawTx,lines:BoundRetailLine[])=>Promise<void>};
export async function createRetailSimulationOrderTx(tx:RetailRawTx&{order:typeof prisma.order},input:SimulationOrderInput){
  const rows=await tx.$queryRaw<{lines:BoundRetailLine[];destinationCountry:string;destinationPostal:string}[]>`SELECT lines,"destinationCountry","destinationPostal" FROM "RetailCart" WHERE id=${input.cartId}::uuid AND "userId"=${input.userId}::uuid FOR UPDATE`;const cart=rows[0];if(!cart?.lines.length)throw Error('Cart unavailable');
  if(input.expectedReviewToken!==undefined&&retailCartReviewToken(cart)!==input.expectedReviewToken)throw Error('Cart changed - review again');
  if(input.validatePrepared)await input.validatePrepared(tx,cart.lines);
  for(const l of [...cart.lines].sort((a,b)=>a.lineKey.localeCompare(b.lineKey))){const current=await tx.$queryRaw<{snapshot:unknown;snapshotId:string;availableQty:number}[]>`SELECT snapshot,"snapshotId","availableQty" FROM "RetailOffer" WHERE published=true AND "lineKey"=${l.lineKey} FOR UPDATE`;if(current.length!==1||!Number.isSafeInteger(current[0].availableQty)||current[0].availableQty<l.qty)throw Error('Offer unavailable');if(current[0].snapshotId!==l.snapshotId)throw Error('Quote changed - review again');assertRetailLineCurrent(l,current[0].snapshot,{productId:l.snapshot.productId,variantId:l.snapshot.variantId,destinationCountry:cart.destinationCountry,destinationPostal:cart.destinationPostal,now:input.now,maxAgeMs:input.maxAgeMs})}
  const cents=cart.lines.reduce((n,l)=>n+l.snapshot.retailUnitCents*l.qty,0);if(!Number.isSafeInteger(cents))throw Error('Amount unavailable');
  // Explicit test-only zero fees, never retail shipping/tax policy or provider total.
  const order=await tx.order.create({data:{userId:input.userId,shippingAddress:input.shippingAddress,paymentMethod:'TestPayment',itemsPrice:cents/100,totalPrice:cents/100,taxPrice:0,shippingPrice:0,paymentNote:'QUALIFIED TEST ONLY - simulated checkout; no charge, supplier order or shipment'}});
  await tx.$executeRaw`INSERT INTO "RetailCheckout" ("orderId",version,lines,"amountCents","destinationCountry","destinationPostal","providerOrderId",state,"displayLines") VALUES (${order.id}::uuid,2,${JSON.stringify(cart.lines)}::jsonb,${cents},${cart.destinationCountry},${cart.destinationPostal},${`SIMULATED-${order.id}`},'CREATED',${JSON.stringify(input.displayLines)}::jsonb)`;
  await tx.$executeRaw`UPDATE "RetailCart" SET lines='[]'::jsonb WHERE id=${input.cartId}::uuid`;return order.id;

}
