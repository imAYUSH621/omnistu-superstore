import type {RetailRawTx} from './retail/transactions';
import {prisma} from '@/db/prisma';
import {loadSupplierOrderPlanTx,supplierPlanDigest} from './supplier-order-plan';
import {assessCJLifecycle,lifecycleResponseDigest} from './cj-lifecycle-evidence';
import {addedSingleOrder,confirmedSingleShipment,supplierFundingQuote,type SupplierFundingQuote} from './cj-funding-evidence';
/** Source preparation only, independently default OFF. Confirmation changes the
 * supplier account and must not be enabled without explicit owner scope. This
 * path never funds, cancels, substitutes packaging, retries or approves a quote. */
export async function prepareSupplierFundingReview(orderId:string){
 if(process.env.CJ_FUNDING_PREPARATION_ENABLED!=='true')throw Error('Supplier funding preparation is OFF');
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 const bound=()=>prisma.$transaction(tx=>fundingBinding(tx,orderId));
 const b=await bound();
 const prior=await prisma.$queryRaw<{state:string;planDigest:string;supplierOrderId:string;quote:SupplierFundingQuote|null}[]>`SELECT state,"planDigest","supplierOrderId",quote FROM "SupplierFundingPreparation" WHERE "orderId"=${orderId}::uuid`;
 if(prior.length){if(prior.length!==1||prior[0].planDigest!==b.digest||prior[0].supplierOrderId!==b.supplierOrderId)throw Error('Funding preparation binding changed');if(prior[0].state==='REVIEW_ONLY'&&prior[0].quote)return prior[0].quote;throw Error('Supplier preparation outcome requires authoritative recovery; no automatic retry');}
 async function request(path:string,token:string|null,body?:unknown){
  const r=await fetch('https://developers.cjdropshipping.com/api2.0/v1/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'CJ-Access-Token':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});
  const v=await r.json();if(!r.ok||!(v.result===true||v.success===true)||v.result===false||v.success===false||(v.code!==undefined&&v.code!==200))throw Error('Supplier response unconfirmed; no automatic retry');return v.data;
 }
 const auth=await request('authentication/getAccessToken',null,{apiKey:key});if(typeof auth?.accessToken!=='string'||!auth.accessToken.trim())throw Error('Supplier authentication unavailable');
 const token=auth.accessToken as string;
 const detail=await request('shopping/order/getOrderDetail?orderId='+encodeURIComponent(b.supplierOrderId),token);
 const unpaid=assessCJLifecycle(b.plan,b.supplierOrderId,detail,null,new Date());
 if(!['CREATED','IN_CART'].includes(unpaid.providerStatus)||detail.shippingZip!==b.plan.address.postalCode)throw Error('Exact unpaid supplier destination and state require review before confirmation');
 // Claim once under the real order lock. Any loss after this point is UNKNOWN,
 // never a reason to confirm again or generate another payable parent.
 await prisma.$transaction(async tx=>{
  const checked=await fundingBinding(tx,orderId);const p=checked.plan;if(checked.supplierOrderId!==b.supplierOrderId)throw Error('Supplier identity changed');
  const a=await tx.$queryRaw<{state:string;supplierOrderId:string|null}[]>`SELECT state,"supplierOrderId" FROM "OrderSupplierAttempt" WHERE "orderId"=${orderId}::uuid`;
  if(supplierPlanDigest(p)!==b.digest||a.length!==1||a[0].state!=='ACCEPTED'||a[0].supplierOrderId!==b.supplierOrderId)throw Error('Supplier binding changed before confirmation');
  await tx.$executeRaw`INSERT INTO "SupplierFundingPreparation"("orderId","planDigest","supplierOrderId",state,"detailDigest") VALUES(${orderId}::uuid,${b.digest},${b.supplierOrderId},${unpaid.providerStatus==='CREATED'?'CART_UNKNOWN':'CONFIRM_UNKNOWN'},${lifecycleResponseDigest(detail)})`;
 });
 if(unpaid.providerStatus==='CREATED'){
  const cart=await request('shopping/order/addCart',token,{cjOrderIdList:[b.supplierOrderId]});addedSingleOrder(cart,b.supplierOrderId);
  await prisma.$transaction(async tx=>{
   const checked=await fundingBinding(tx,orderId);const p=checked.plan;if(checked.supplierOrderId!==b.supplierOrderId)throw Error('Supplier identity changed');if(supplierPlanDigest(p)!==b.digest)throw Error('Supplier binding changed after add cart');
   const changed=await tx.$executeRaw`UPDATE "SupplierFundingPreparation" SET state='CONFIRM_UNKNOWN',"cartDigest"=${lifecycleResponseDigest(cart)} WHERE "orderId"=${orderId}::uuid AND state='CART_UNKNOWN' AND "planDigest"=${b.digest}`;if(changed!==1)throw Error('Supplier cart checkpoint uncertain');
  });
 }
 const confirmation=await request('shopping/order/addCartConfirm',token,{cjOrderIdList:[b.supplierOrderId]});
 const shipmentOrderId=confirmedSingleShipment(confirmation);
 await prisma.$transaction(async tx=>{
  const checked=await fundingBinding(tx,orderId);const p=checked.plan;if(checked.supplierOrderId!==b.supplierOrderId)throw Error('Supplier identity changed');if(supplierPlanDigest(p)!==b.digest)throw Error('Supplier binding changed after confirmation');
  const changed=await tx.$executeRaw`UPDATE "SupplierFundingPreparation" SET state='PARENT_UNKNOWN',"shipmentOrderId"=${shipmentOrderId},"confirmationDigest"=${lifecycleResponseDigest(confirmation)} WHERE "orderId"=${orderId}::uuid AND state='CONFIRM_UNKNOWN' AND "planDigest"=${b.digest}`;
  if(changed!==1)throw Error('Supplier preparation checkpoint uncertain');
 });
 const parent=await request('shopping/order/saveGenerateParentOrder',token,{shipmentOrderId});
 const quote=supplierFundingQuote(parent,b.supplierOrderId,shipmentOrderId);
 await prisma.$transaction(async tx=>{
  const checked=await fundingBinding(tx,orderId);const p=checked.plan;if(checked.supplierOrderId!==b.supplierOrderId)throw Error('Supplier identity changed');if(supplierPlanDigest(p)!==b.digest)throw Error('Supplier binding changed after final quote');
  const changed=await tx.$executeRaw`UPDATE "SupplierFundingPreparation" SET state='REVIEW_ONLY',quote=${JSON.stringify(quote)}::jsonb,"parentDigest"=${lifecycleResponseDigest(parent)} WHERE "orderId"=${orderId}::uuid AND state='PARENT_UNKNOWN' AND "planDigest"=${b.digest} AND "shipmentOrderId"=${shipmentOrderId}`;
  if(changed!==1)throw Error('Supplier quote checkpoint uncertain');
 });
 return quote;
}

async function fundingBinding(tx:RetailRawTx,orderId:string){
 const plan=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'});
 const attempts=await tx.$queryRaw<{state:string;supplierOrderId:string|null}[]>`SELECT state,"supplierOrderId" FROM "OrderSupplierAttempt" WHERE "orderId"=${orderId}::uuid`;
 if(attempts.length!==1||attempts[0].state!=='ACCEPTED'||!attempts[0].supplierOrderId)throw Error('Supplier outcome uncertain; no confirmation or retry');
 const allocated=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${orderId}::uuid`;
 if(allocated.length!==plan.lines.length||allocated.some(a=>a.state!=='CONSUMED'||!plan.lines.some(l=>l.lineKey===a.lineKey&&l.qty===a.qty)))throw Error('Consumed exact supplier allocation required');
 const recent=await tx.$queryRaw<{state:string}[]>`SELECT evidence->>'state' AS state FROM "SupplierLifecycleObservation" WHERE "orderId"=${orderId}::uuid ORDER BY "observedAt" DESC LIMIT 1`;
 if(recent.some(r=>!['UNPAID','AWAITING_FUNDING_REVIEW'].includes(r.state)))throw Error('Supplier already progressed; funding recovery review required');
 return {plan,supplierOrderId:attempts[0].supplierOrderId,digest:supplierPlanDigest(plan)};
}
