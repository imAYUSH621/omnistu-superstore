import {prisma} from '@/db/prisma';
import type {RetailRawTx} from '@/lib/retail/transactions';
import {retailCartReviewToken} from '@/lib/retail/transactions';
import {bindRetailLine,type BoundRetailLine} from '@/lib/retail/snapshot';
import {persistSupplierOrderPlanTx} from '@/lib/supplier-order-plan';
/** Server-only preparation. Not a network action or a live-checkout activation.
 * Uses the owner's persisted selected RetailCart, not caller-chosen supplier IDs.
 * V1 intentionally supports one exact variant per Store product; multiple variants
 * need a separate order-line migration before they can use the legacy OrderItem PK. */
export async function prepareSupplierBoundOrderTx(tx:RetailRawTx&{order:typeof prisma.order;orderItem:typeof prisma.orderItem},input:{userId:string;cartId:string;reviewToken:string;idempotencyKey:string;now:Date;maxAgeMs:number;approvedShippingCents:number;approvedTaxCents:number;commercialTermsSource:string}){
 if(!input.commercialTermsSource.trim()||!Number.isSafeInteger(input.approvedShippingCents)||input.approvedShippingCents<0||!Number.isSafeInteger(input.approvedTaxCents)||input.approvedTaxCents<0)throw Error('Reviewed commercial totals required');
 // Until explicit totals are represented in the immutable approval model, refuse,
 // never silently collapse delivery/tax into an unapproved item price.
 if(input.approvedShippingCents!==0||input.approvedTaxCents!==0)throw Error('Nonzero shipping/tax binding needs reviewed model extension');
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`retail-cart:${input.userId}`}))`;
 const prior=await tx.order.findUnique({where:{idempotencyKey:input.idempotencyKey}});
 if(prior){if(prior.userId!==input.userId)throw Error('Checkout identity unavailable');return prior.id}
 const users=await tx.$queryRaw<{address:unknown;paymentMethod:string}[]>`SELECT address,"paymentMethod" FROM "User" WHERE id=${input.userId}::uuid FOR UPDATE`;
 if(users.length!==1||users[0].paymentMethod!=='PayPal')throw Error('Reviewed payment method required');
 const carts=await tx.$queryRaw<{lines:BoundRetailLine[];destinationCountry:string;destinationPostal:string}[]>`SELECT lines,"destinationCountry","destinationPostal" FROM "RetailCart" WHERE id=${input.cartId}::uuid AND "userId"=${input.userId}::uuid FOR UPDATE`;
 const cart=carts[0];if(carts.length!==1||!cart.lines.length||retailCartReviewToken(cart)!==input.reviewToken)throw Error('Current selected cart review required');
 if(new Set(cart.lines.map(l=>l.snapshot.productId)).size!==cart.lines.length)throw Error('Multiple variants of one product require exact order-line support');
 const lines=cart.lines.map(l=>bindRetailLine(l.snapshot,l.qty,input.now,input.maxAgeMs));
 const cents=lines.reduce((sum,l)=>sum+l.qty*l.snapshot.retailUnitCents,0);if(!Number.isSafeInteger(cents)||cents<=0)throw Error('Order amount unavailable');
 const order=await tx.order.create({data:{userId:input.userId,shippingAddress:users[0].address as object,paymentMethod:'PayPal',itemsPrice:cents/100,shippingPrice:0,taxPrice:0,totalPrice:cents/100,idempotencyKey:input.idempotencyKey,paymentNote:'SUPPLIER_BOUND_PREPARATION - commercial activation off'}});
 for(const line of lines){
  const products=await tx.$queryRaw<{name:string;slug:string;images:string[];label:string}[]>`SELECT p.name,p.slug,p.images,v.name AS label FROM "Product" p JOIN "ProductVariant" v ON v."productId"=p.id WHERE p.id=${line.snapshot.productId}::uuid AND v.id=${line.snapshot.variantId}::uuid`;
  if(products.length!==1||!products[0].label.trim())throw Error('Exact buyer option unavailable');
  const p=products[0];await tx.orderItem.create({data:{orderId:order.id,productId:line.snapshot.productId,qty:line.qty,price:line.snapshot.retailUnitCents/100,name:p.name+' - '+p.label,slug:p.slug,image:p.images[0]||''}});
 }
 await persistSupplierOrderPlanTx(tx,{orderId:order.id,userId:input.userId,lines,now:input.now,maxAgeMs:input.maxAgeMs,commercialTermsSource:input.commercialTermsSource});
 // Reservation is a bounded internal allocation, not a supplier reservation.
 for(const l of [...lines].sort((a,b)=>a.lineKey.localeCompare(b.lineKey))){
  const changed=await tx.$executeRaw`UPDATE "RetailOffer" SET "availableQty"="availableQty"-${l.qty} WHERE "lineKey"=${l.lineKey} AND "snapshotId"=${l.snapshotId} AND "availableQty">=${l.qty}`;
  if(changed!==1)throw Error('Exact offer stock changed');
  await tx.$executeRaw`INSERT INTO "OrderSupplierAllocation" ("orderId","lineKey",qty,state) VALUES (${order.id}::uuid,${l.lineKey},${l.qty},'HELD')`;
 }
 await tx.$executeRaw`UPDATE "RetailCart" SET lines='[]'::jsonb WHERE id=${input.cartId}::uuid`;
 return order.id;
}
