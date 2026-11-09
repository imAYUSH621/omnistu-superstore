import {prisma} from '@/db/prisma';
import {loadSupplierOrderPlanTx} from './supplier-order-plan';
import {assertDispatchSpendAllowed} from './spend-guard';
export {cjPayloadFromSupplierPlan} from './bound-supplier-payload';
import {cjPayloadFromSupplierPlan} from './bound-supplier-payload';
/** Single entry for automatic and operator requests. A durable request marker
 * precedes provider I/O. Uncertain outcomes are never retried automatically.
 * payType3 creates an unpaid supplier order only; funding/dispatch is separate. */
export async function dispatchPersistedSupplierOrder(orderId:string){
 if(process.env.FULFILLMENT_DISPATCH_ENABLED!=='true')return{status:'OFF' as const,supplierOrderId:null};
 const plan=await prisma.$transaction(async tx=>{const plan=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000});const allocations=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${orderId}::uuid`;if(allocations.length!==plan.lines.length||allocations.some(a=>a.state!=='CONSUMED'||!plan.lines.some(l=>l.lineKey===a.lineKey&&l.qty===a.qty)))throw Error('Consumed paid allocation required');return plan});
 const allowed=assertDispatchSpendAllowed({totalPrice:plan.amountCents/100,orderitems:plan.lines.map(l=>({qty:l.qty}))});
 if(!allowed.ok)throw Error('Supplier spend limits require review');
 const payload=cjPayloadFromSupplierPlan(plan);
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 // Claim before any external call. A replay never authenticates or submits.
 const claimed=await prisma.$transaction(async tx=>{
  await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000});
  const r=await tx.$executeRaw`INSERT INTO "OrderSupplierAttempt"("orderId",state) VALUES (${orderId}::uuid,'REQUESTED') ON CONFLICT DO NOTHING`;return r===1;
 });
 if(!claimed)return{status:'REVIEW_REQUIRED' as const,supplierOrderId:null};
 try{
  const auth=await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key}),signal:AbortSignal.timeout(10000),cache:'no-store',redirect:'error'});
  const token=await auth.json();if(!auth.ok||token.result!==true||token.success===false||(token.code!==undefined&&token.code!==200)||typeof token.data?.accessToken!=='string'||!token.data.accessToken.trim())throw Error('Supplier authentication unavailable');
  const response=await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2',{method:'POST',headers:{'Content-Type':'application/json','CJ-Access-Token':token.data.accessToken},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000),cache:'no-store',redirect:'error'});
  const body=await response.json();
  if(!response.ok||body.result!==true||body.success===false||(body.code!==undefined&&body.code!==200)||typeof body.data?.orderId!=='string'||!body.data.orderId.trim()){
   await prisma.$executeRaw`UPDATE "OrderSupplierAttempt" SET state='UNKNOWN' WHERE "orderId"=${orderId}::uuid AND state='REQUESTED'`;
   return{status:'REVIEW_REQUIRED' as const,supplierOrderId:null};
  }
  await prisma.$executeRaw`UPDATE "OrderSupplierAttempt" SET state='ACCEPTED',"supplierOrderId"=${body.data.orderId} WHERE "orderId"=${orderId}::uuid AND state='REQUESTED'`;
  return{status:'SUPPLIER_ORDER_CREATED_UNPAID' as const,supplierOrderId:body.data.orderId};
 }catch{
  await prisma.$executeRaw`UPDATE "OrderSupplierAttempt" SET state='UNKNOWN' WHERE "orderId"=${orderId}::uuid AND state='REQUESTED'`;
  return{status:'REVIEW_REQUIRED' as const,supplierOrderId:null};
 }
}
