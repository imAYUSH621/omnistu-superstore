import {prisma} from '@/db/prisma';
import {loadSupplierOrderPlanTx,supplierPlanDigest} from './supplier-order-plan';
import {assessCJLifecycle,lifecycleResponseDigest,type CJLifecycleEvidence} from './cj-lifecycle-evidence';
import type {RetailRawTx} from './retail/transactions';
/** Default OFF. Enabling requires a separately approved account-read budget.
 * This performs no confirmation, payment, order creation, cancellation or retry.
 * Only server-authenticated CJ reads can reach the persistence body. */
export async function reconcileSupplierLifecycle(orderId:string){
 if(process.env.CJ_LIFECYCLE_RECONCILIATION_ENABLED!=='true')throw Error('Supplier delivery verification is OFF; no delivery was recorded');
 const now=new Date();
 const initial=await prisma.$transaction(async tx=>{
  const plan=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now,maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'});
  const attempts=await tx.$queryRaw<{state:string;supplierOrderId:string|null}[]>`SELECT state,"supplierOrderId" FROM "OrderSupplierAttempt" WHERE "orderId"=${orderId}::uuid`;
  if(attempts.length!==1||attempts[0].state!=='ACCEPTED'||!attempts[0].supplierOrderId)throw Error('Supplier outcome uncertain; reconcile identity before any retry');
  return {plan,supplierOrderId:attempts[0].supplierOrderId};
 });
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 async function read(url:string,token:string){const r=await fetch(url,{headers:{'CJ-Access-Token':token},signal:AbortSignal.timeout(15000),cache:'no-store'});const body=await r.json();if(!r.ok||body.result!==true)throw Error('Supplier read unavailable; existing delivery unchanged');return body.data;}
 const auth=await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key}),signal:AbortSignal.timeout(10000)});
 const token=await auth.json();if(!auth.ok||token.result!==true||typeof token.data?.accessToken!=='string'||!token.data.accessToken.trim())throw Error('Supplier authentication unavailable');
 const detail=await read('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId='+encodeURIComponent(initial.supplierOrderId),token.data.accessToken);
 let tracking:unknown=null;
 if(detail?.orderStatus==='DELIVERED'){
  if(typeof detail.trackNumber!=='string'||!detail.trackNumber.trim())throw Error('Supplier tracking unavailable');
  const rows=await read('https://developers.cjdropshipping.com/api2.0/v1/logistic/trackInfo?trackNumber='+encodeURIComponent(detail.trackNumber),token.data.accessToken);
  if(!Array.isArray(rows)||rows.length!==1)throw Error('Carrier evidence ambiguous');tracking=rows[0];
 }
 const evidence=assessCJLifecycle(initial.plan,initial.supplierOrderId,detail,tracking,new Date());
 return prisma.$transaction(tx=>persistSupplierLifecycleTx(tx,{orderId,planDigest:supplierPlanDigest(initial.plan),supplierOrderId:initial.supplierOrderId,observedAt:now,evidence,responseDigest:lifecycleResponseDigest({detail,tracking})}));
}
/** Internal persistence seam for real disposable-DB tests. It is not a public
 * action, and caller JSON cannot enter it from a request body. */
export async function persistSupplierLifecycleTx(tx:RetailRawTx,input:{orderId:string;planDigest:string;supplierOrderId:string;observedAt:Date;evidence:CJLifecycleEvidence;responseDigest:string}){
 const p=await loadSupplierOrderPlanTx(tx,{orderId:input.orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'});
 if(supplierPlanDigest(p)!==input.planDigest||input.evidence.supplierOrderId!==input.supplierOrderId)throw Error('Supplier binding changed during reconciliation');
 const attempt=await tx.$queryRaw<{supplierOrderId:string;state:string}[]>`SELECT "supplierOrderId",state FROM "OrderSupplierAttempt" WHERE "orderId"=${input.orderId}::uuid`;
 if(attempt.length!==1||attempt[0].state!=='ACCEPTED'||attempt[0].supplierOrderId!==input.supplierOrderId)throw Error('Supplier attempt changed');
 const previous=await tx.$queryRaw<{observedAt:Date;evidence:CJLifecycleEvidence}[]>`SELECT "observedAt",evidence FROM "SupplierLifecycleObservation" WHERE "orderId"=${input.orderId}::uuid ORDER BY "observedAt" DESC LIMIT 1`;
 if(previous.length&&(previous[0].observedAt>=input.observedAt||(previous[0].evidence.state==='DELIVERED'&&input.evidence.state!=='DELIVERED')||(previous[0].evidence.state==='SHIPPED'&&!['SHIPPED','DELIVERED'].includes(input.evidence.state))))throw Error('Out-of-order supplier state requires review');
 const e=input.evidence;
 const rank={UNPAID:0,AWAITING_FUNDING_REVIEW:1,FUNDED_AWAITING_SHIPMENT:2,SHIPPED:3,DELIVERED:4,CANCELLED:5};
 if(previous.length&&rank[e.state]<rank[previous[0].evidence.state])throw Error('Regressing supplier state requires review');
 await tx.$executeRaw`INSERT INTO "SupplierLifecycleObservation"("orderId","planDigest","supplierOrderId","observedAt","responseDigest",evidence) VALUES (${input.orderId}::uuid,${input.planDigest},${input.supplierOrderId},${input.observedAt},${input.responseDigest},${JSON.stringify(e)}::jsonb)`;
 // A fresh authenticated provider observation is the only real delivery writer.
 // No derived arrival date, invented carrier, or payment==delivery shortcut.
 if(e.state==='SHIPPED'||e.state==='DELIVERED'){
  await tx.$executeRaw`UPDATE "Order" SET "dispatchStatus"='DISPATCHED',"dispatchSupplier"='CJ_DROPSHIPPING',"supplierOrderId"=${e.supplierOrderId},"trackingNumber"=${e.trackingNumber},"trackingCarrier"=${e.carrier},"dispatchedAt"=${e.dispatchedAt?new Date(e.dispatchedAt):null},"isDelivered"=${e.state==='DELIVERED'},"deliveredAt"=${e.deliveredAt?new Date(e.deliveredAt):null} WHERE id=${input.orderId}::uuid`;
 }else await tx.$executeRaw`UPDATE "Order" SET "dispatchStatus"=${e.state},"dispatchError"=${e.state==='CANCELLED'?'Supplier cancelled; customer payment/refund needs independent review':null} WHERE id=${input.orderId}::uuid`;
 return e;
}
