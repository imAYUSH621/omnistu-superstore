import {prisma} from '@/db/prisma';
import {z} from 'zod';
import type {RetailRawTx} from './retail/transactions';
import {loadSupplierOrderPlanTx,supplierPlanDigest,type SupplierOrderPlan} from './supplier-order-plan';
import {inspectCJOrderIdentity,assessCJLifecycle,lifecycleResponseDigest} from './cj-lifecycle-evidence';
import {persistSupplierLifecycleTx} from './supplier-lifecycle';
/** Query-by-custom-ID recovery, not resubmission. No caller-selected supplier ID,
 * current quote revival, account mutation, payment, confirmation or retry. */
export function inspectRecoveredCJCreation(plan:SupplierOrderPlan,raw:unknown,now:Date){
 const identifier=z.object({orderId:z.string().trim().min(1).max(200)}).parse(raw).orderId;
 const detail=inspectCJOrderIdentity(plan,identifier,raw,now);
 const echo=z.object({shippingZip:z.literal(plan.address.postalCode),productList:z.array(z.object({storeLineItemId:z.string(),orderNumber:z.literal(plan.orderId)})).length(plan.lines.length)}).parse(raw);
 if(new Set(echo.productList.map(p=>p.storeLineItemId)).size!==plan.lines.length||echo.productList.some(p=>!plan.lines.some(l=>l.lineKey===p.storeLineItemId)))throw Error('Recovered merchant order echo requires review');
 // An already-funded/shipped/cancelled response needs its own recovery evidence;
 // it cannot be relabelled an unpaid create success or authorize another payment.
 if(!['CREATED','IN_CART','UNPAID'].includes(detail.orderStatus))throw Error('Recovered supplier order already progressed; independent review required');
 return assessCJLifecycle(plan,identifier,raw,null,now);
}
async function binding(tx:RetailRawTx,orderId:string){
 const plan=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'});
 const attempts=await tx.$queryRaw<{state:string;supplierOrderId:string|null}[]>`SELECT state,"supplierOrderId" FROM "OrderSupplierAttempt" WHERE "orderId"=${orderId}::uuid`;
 if(attempts.length!==1)throw Error('Persisted supplier attempt required');const attempt=attempts[0];
 if(attempt.state==='ACCEPTED'&&attempt.supplierOrderId)return {plan,attempt};
 if(!['REQUESTED','UNKNOWN'].includes(attempt.state)||attempt.supplierOrderId!==null)throw Error('Supplier creation identity requires review');
 const allocations=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${orderId}::uuid`;
 if(allocations.length!==plan.lines.length||allocations.some(a=>a.state!=='CONSUMED'||!plan.lines.some(l=>l.lineKey===a.lineKey&&l.qty===a.qty)))throw Error('Consumed exact supplier allocation required');
 return {plan,attempt};
}
export async function recoverSupplierCreation(orderId:string){
 if(process.env.CJ_CREATION_RECOVERY_ENABLED!=='true')throw Error('Supplier creation recovery is OFF');
 const initial=await prisma.$transaction(tx=>binding(tx,orderId));
 if(initial.attempt.state==='ACCEPTED')return {status:'ACCEPTED_ALREADY_RECORDED' as const,supplierOrderId:initial.attempt.supplierOrderId};
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 async function request(path:string,token:string|null,body?:unknown){
  const r=await fetch('https://developers.cjdropshipping.com/api2.0/v1/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'CJ-Access-Token':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});
  const v=await r.json();if(!r.ok||v.result!==true||v.success===false||(v.code!==undefined&&v.code!==200))throw Error('Supplier creation query unavailable; no retry authorized');return v.data;
 }
 const auth=await request('authentication/getAccessToken',null,{apiKey:key});if(typeof auth?.accessToken!=='string'||!auth.accessToken.trim())throw Error('Supplier authentication unavailable');
 const raw=await request('shopping/order/getOrderDetail?orderId='+encodeURIComponent(initial.plan.orderId),auth.accessToken);
 const observedAt=new Date(),evidence=inspectRecoveredCJCreation(initial.plan,raw,observedAt),digest=supplierPlanDigest(initial.plan);
 return prisma.$transaction(async tx=>{
  const checked=await binding(tx,orderId);if(supplierPlanDigest(checked.plan)!==digest)throw Error('Supplier creation binding changed');
  if(checked.attempt.state==='ACCEPTED'){if(checked.attempt.supplierOrderId!==evidence.supplierOrderId)throw Error('Conflicting accepted supplier identity');return {status:'ACCEPTED_ALREADY_RECORDED' as const,supplierOrderId:evidence.supplierOrderId};}
  const changed=await tx.$executeRaw`UPDATE "OrderSupplierAttempt" SET state='ACCEPTED',"supplierOrderId"=${evidence.supplierOrderId} WHERE "orderId"=${orderId}::uuid AND state IN ('REQUESTED','UNKNOWN') AND "supplierOrderId" IS NULL`;
  if(changed!==1)throw Error('Supplier creation outcome changed');
  await persistSupplierLifecycleTx(tx,{orderId,planDigest:digest,supplierOrderId:evidence.supplierOrderId,observedAt,evidence,responseDigest:lifecycleResponseDigest(raw)});
  return {status:'RECOVERED_UNPAID' as const,supplierOrderId:evidence.supplierOrderId};
 });
}
