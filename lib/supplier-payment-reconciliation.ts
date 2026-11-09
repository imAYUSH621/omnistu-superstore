import {prisma} from '@/db/prisma';
import type {RetailRawTx} from './retail/transactions';
import {loadSupplierOrderPlanTx,supplierPlanDigest} from './supplier-order-plan';
import {inspectCJOrderIdentity,lifecycleResponseDigest} from './cj-lifecycle-evidence';
import {assessSupplierBilling,type SupplierBillingEvidence} from './cj-billing-evidence';
import type {SupplierFundingQuote} from './cj-funding-evidence';
/** Default OFF, separate from confirmation and lifecycle gates. This uses only
 * authentication and scoped query endpoints. It never pays or mutates supplier
 * state, unlocks retries, claims payId certainty, or copies account-wide history. */
export async function reconcileSupplierPayment(orderId:string){
 if(process.env.CJ_PAYMENT_RECONCILIATION_ENABLED!=='true')throw Error('Supplier payment record check is OFF');
 const initial=await prisma.$transaction(tx=>paymentBinding(tx,orderId));
 if(initial.supplierOrderId.length>64)throw Error('Supplier billing identifier mapping requires review');
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 async function request(path:string,token:string|null,body?:unknown){
  const r=await fetch('https://developers.cjdropshipping.com/api2.0/v1/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'CJ-Access-Token':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});
  const v=await r.json();if(!r.ok||v.result!==true||v.success===false||(v.code!==undefined&&v.code!==200))throw Error('Supplier payment read unavailable; no retry authorized');return v.data;
 }
 const auth=await request('authentication/getAccessToken',null,{apiKey:key});if(typeof auth?.accessToken!=='string'||!auth.accessToken.trim())throw Error('Supplier authentication unavailable');
 const detail=await request('shopping/order/getOrderDetail?orderId='+encodeURIComponent(initial.supplierOrderId),auth.accessToken);
 // Validate exact historical address/products/origin/method and accepted ID.
 // Payment review must not use missing postal evidence to claim shipment proof.
 const assessment=inspectCJOrderIdentity(initial.plan,initial.supplierOrderId,detail,new Date());
 const raw=await request('shopping/wallet/billingHistory',auth.accessToken,{pageNum:1,pageSize:100,orderId:initial.supplierOrderId,tradeTypeList:[1]});
 const observedAt=new Date();
 const billing=assessSupplierBilling(raw,initial.supplierOrderId,initial.quoteAmount,observedAt);
 const evidence:SupplierPaymentObservation={observedAt:observedAt.toISOString(),reviewOnly:true,retryAllowed:false,providerStatus:assessment.orderStatus,providerAmountUsd:String(assessment.orderAmount),billing};
 return prisma.$transaction(tx=>persistSupplierPaymentObservationTx(tx,{orderId,planDigest:initial.digest,supplierOrderId:initial.supplierOrderId,quoteDigest:initial.quoteDigest,observedAt,responseDigest:lifecycleResponseDigest({detail,billing:raw}),evidence}));
}
export type SupplierPaymentObservation={observedAt:string;reviewOnly:true;retryAllowed:false;providerStatus:string;providerAmountUsd:string;billing:SupplierBillingEvidence};
async function paymentBinding(tx:RetailRawTx,orderId:string){
 const plan=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'});
 const attempts=await tx.$queryRaw<{state:string;supplierOrderId:string|null}[]>`SELECT state,"supplierOrderId" FROM "OrderSupplierAttempt" WHERE "orderId"=${orderId}::uuid`;
 if(attempts.length!==1||attempts[0].state!=='ACCEPTED'||!attempts[0].supplierOrderId)throw Error('Supplier identity uncertain; no payment recovery or retry');
 const allocations=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${orderId}::uuid`;
 if(allocations.length!==plan.lines.length||allocations.some(a=>a.state!=='CONSUMED'||!plan.lines.some(l=>l.lineKey===a.lineKey&&l.qty===a.qty)))throw Error('Exact consumed supplier allocation required');
 const q=await tx.$queryRaw<{state:string;planDigest:string;supplierOrderId:string;quote:SupplierFundingQuote|null}[]>`SELECT state,"planDigest","supplierOrderId",quote FROM "SupplierFundingPreparation" WHERE "orderId"=${orderId}::uuid`;
 const digest=supplierPlanDigest(plan);if(q.length>1||q.some(r=>r.planDigest!==digest||r.supplierOrderId!==attempts[0].supplierOrderId))throw Error('Supplier quote binding changed');
 const quote=q[0]?.state==='REVIEW_ONLY'?q[0].quote:null;
 return {plan,digest,supplierOrderId:attempts[0].supplierOrderId,quoteAmount:quote?.paymentInformation.payableAmount??null,quoteDigest:lifecycleResponseDigest(q)};
}
/** Internal persistence seam only. Incoming requests cannot provide this input.
 * New observations do not rewrite a funding journal or financial/order state. */
export async function persistSupplierPaymentObservationTx(tx:RetailRawTx,input:{orderId:string;planDigest:string;supplierOrderId:string;quoteDigest:string;observedAt:Date;responseDigest:string;evidence:SupplierPaymentObservation}){
 const b=await paymentBinding(tx,input.orderId);
 if(b.digest!==input.planDigest||b.supplierOrderId!==input.supplierOrderId||b.quoteDigest!==input.quoteDigest||input.evidence.billing.reference!==b.supplierOrderId||input.evidence.reviewOnly!==true||input.evidence.retryAllowed!==false)throw Error('Supplier binding changed during payment check');
 await tx.$executeRaw`INSERT INTO "SupplierPaymentObservation"("orderId","planDigest","supplierOrderId","observedAt","responseDigest",evidence) VALUES(${input.orderId}::uuid,${input.planDigest},${input.supplierOrderId},${input.observedAt},${input.responseDigest},${JSON.stringify(input.evidence)}::jsonb)`;
 return input.evidence;
}
