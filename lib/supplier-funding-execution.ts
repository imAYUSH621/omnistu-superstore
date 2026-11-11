import {z} from 'zod';
import {prisma} from '@/db/prisma';
import type {RetailRawTx} from './retail/transactions';
import {loadSupplierOrderPlanTx,supplierPlanDigest} from './supplier-order-plan';
import {assessCJLifecycle,lifecycleResponseDigest,type CJLifecycleEvidence} from './cj-lifecycle-evidence';
import {addedSingleOrder,confirmedSingleShipment,supplierFundingQuote,type SupplierFundingQuote} from './cj-funding-evidence';
import {persistSupplierLifecycleTx} from './supplier-lifecycle';
/** Default-OFF supplier funding execution. This is the only code path that can
 * call payBalanceV2. Grounded vendor contract (developer@cjdropshipping.com,
 * support reply 2026-11-11): payBalanceV2 takes no amount and debits exactly
 * what saveGenerateParentOrder generated for that payId; the same payId can
 * never charge twice (a repeat returns an error); an expired payment is
 * resolved by regenerating a new payId for the same order, never by recreating
 * the order; there is no payId lookup, so paid/unpaid truth is getOrderDetail
 * order status only. Pair-mismatch behavior is still unconfirmed by the vendor,
 * so the pair is never split or combined across responses: both fields always
 * come from one saveGenerateParentOrder response and are persisted atomically
 * before any payment attempt. Amount expiry has no documented validity window,
 * so the quote is generated fresh inside this run and paid immediately. */
const BASE='https://developers.cjdropshipping.com/api2.0/v1/';
const usd=z.string().trim().regex(/^\d+(\.\d{1,2})?$/,'Exact USD amount required').refine(v=>Number.isSafeInteger(Math.round(Number(v)*100))&&Number(v)>0,'Exact positive USD amount required');
const cents=(v:string)=>Math.round(Number(v)*100);
export function approvedAmountCents(raw:string){return cents(usd.parse(raw));}
export type PayOutcome={kind:'success'}|{kind:'error';expirySignalled:boolean}|{kind:'ambiguous'};
/** Strict success: explicit result true without an error code. Anything else is
 * a vendor error, never a presumed rejection; expiry is only the vendor's own
 * explicit expiry message, never an invented timeout from payExpireTime. */
export function classifyPayBalanceResponse(raw:unknown):PayOutcome{
 const v=(raw??{}) as {result?:unknown;success?:unknown;code?:unknown;message?:unknown};
 if(v.result===true&&v.success!==false&&(v.code===undefined||v.code===200))return{kind:'success'};
 return{kind:'error',expirySignalled:/expir/i.test(String(v.message??''))};
}
export type FundingObservation='PAID'|'UNPAID'|'CANCELLED';
/** Paid is only an explicit funded/shipped/delivered provider state. Cancelled
 * stays distinct; unknown or conflicting evidence never becomes paid. */
export function classifyFundingState(state:CJLifecycleEvidence['state']):FundingObservation{
 if(state==='UNPAID'||state==='AWAITING_FUNDING_REVIEW')return'UNPAID';
 if(state==='CANCELLED')return'CANCELLED';
 return'PAID';
}
const MONEY_FIELDS=['actualPayment','payableAmount','balanceDeduction','billAmount','commodityDiscount','commodityTotalAmount','couponAmount','freight','iossAmount','iossTaxHandlingFee','iossTaxes','orderOriginalAmount','orderProductAmount','postageDiscount','serviceFee'] as const;
/** A regenerated quote never inherits the reviewed approval: it must bind to
 * the same supplier order, the same parent shipment, and every identical money
 * field, and its payable amount must equal the exact approved amount. A new
 * payId or expiry text for the same parent is the vendor-sanctioned refresh. */
export function quoteMatchesReviewedApproval(reviewed:SupplierFundingQuote,fresh:SupplierFundingQuote,approvedCents:number){
 if(fresh.supplierOrderId!==reviewed.supplierOrderId||fresh.shipmentOrderId!==reviewed.shipmentOrderId)throw Error('Regenerated supplier quote belongs to a different parent; a new reviewed approval is required');
 if(fresh.orderMoney!==reviewed.orderMoney)throw Error('Regenerated supplier order total changed; a new reviewed approval is required');
 for(const f of MONEY_FIELDS)if(fresh.paymentInformation[f]!==reviewed.paymentInformation[f])throw Error('Regenerated supplier quote amounts changed; a new reviewed approval is required');
 if(cents(fresh.paymentInformation.payableAmount)!==approvedCents)throw Error('Supplier quote does not match the exact approved amount');
 if(fresh.paymentInformation.canDeduct!==true)throw Error('Supplier balance cannot cover the exact approved amount; an owner top-up decision is required');
}
export type FundingExecutionResult={state:'PAID'|'PAY_UNKNOWN'|'HOLD_REVIEW';message:string;shipmentOrderId:string;payId:string;attempts:number};

async function coreBindingTx(tx:RetailRawTx,orderId:string){
 const plan=await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'});
 const digest=supplierPlanDigest(plan);
 const attempts=await tx.$queryRaw<{state:string;supplierOrderId:string|null}[]>`SELECT state,"supplierOrderId" FROM "OrderSupplierAttempt" WHERE "orderId"=${orderId}::uuid`;
 if(attempts.length!==1||attempts[0].state!=='ACCEPTED'||!attempts[0].supplierOrderId)throw Error('Supplier outcome uncertain; no payment attempt');
 const allocated=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${orderId}::uuid`;
 if(allocated.length!==plan.lines.length||allocated.some(a=>a.state!=='CONSUMED'||!plan.lines.some(l=>l.lineKey===a.lineKey&&l.qty===a.qty)))throw Error('Consumed exact supplier allocation required');
 const recent=await tx.$queryRaw<{state:string}[]>`SELECT evidence->>'state' AS state FROM "SupplierLifecycleObservation" WHERE "orderId"=${orderId}::uuid ORDER BY "observedAt" DESC LIMIT 1`;
 if(recent.some(r=>!['UNPAID','AWAITING_FUNDING_REVIEW'].includes(r.state)))throw Error('Supplier already progressed; funding recovery review required');
 return{plan,digest,supplierOrderId:attempts[0].supplierOrderId};
}
async function claimBindingTx(tx:RetailRawTx,orderId:string){
 const b=await coreBindingTx(tx,orderId);
 const prep=await tx.$queryRaw<{state:string;planDigest:string;supplierOrderId:string;quote:SupplierFundingQuote|null}[]>`SELECT state,"planDigest","supplierOrderId",quote FROM "SupplierFundingPreparation" WHERE "orderId"=${orderId}::uuid`;
 if(prep.length!==1||prep[0].state!=='REVIEW_ONLY'||!prep[0].quote||prep[0].planDigest!==b.digest||prep[0].supplierOrderId!==b.supplierOrderId)throw Error('A reviewed supplier funding quote is required before execution');
 const existing=await tx.$queryRaw<{state:string}[]>`SELECT state FROM "SupplierFundingExecution" WHERE "orderId"=${orderId}::uuid`;
 if(existing.length)throw Error('Supplier funding execution already recorded; review its exact state before any new attempt');
 return{...b,quote:prep[0].quote as SupplierFundingQuote};
}

export async function executeSupplierFunding(orderId:string,approvedAmountUsd:string,approvedBy:string):Promise<FundingExecutionResult>{
 if(process.env.CJ_FUNDING_EXECUTION_ENABLED!=='true')throw Error('Supplier funding execution is OFF');
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 const approvedCents=approvedAmountCents(approvedAmountUsd);
 const admin=z.string().trim().min(1).max(100).parse(approvedBy);
 const b=await prisma.$transaction(tx=>claimBindingTx(tx,orderId));
 if(cents(b.quote.paymentInformation.payableAmount)!==approvedCents)throw Error('Approved amount does not match the reviewed supplier quote');
 async function request(path:string,token:string|null,body?:unknown){
  const r=await fetch(BASE+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{'CJ-Access-Token':token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});
  const v=await r.json();if(!r.ok||!(v.result===true||v.success===true)||v.result===false||v.success===false||(v.code!==undefined&&v.code!==200))throw Error('Supplier response unconfirmed; no automatic retry');return v.data;
 }
 const auth=await request('authentication/getAccessToken',null,{apiKey:key});if(typeof auth?.accessToken!=='string'||!auth.accessToken.trim())throw Error('Supplier authentication unavailable');
 const token=auth.accessToken as string;
 // Pre-payment state: only an exact, still-unpaid supplier order may proceed.
 const before=await request('shopping/order/getOrderDetail?orderId='+encodeURIComponent(b.supplierOrderId),token);
 const beforeEvidence=assessCJLifecycle(b.plan,b.supplierOrderId,before,null,new Date());
 const beforeCls=classifyFundingState(beforeEvidence.state);
 if(beforeCls==='PAID')throw Error('Supplier order is already funded; no payment sent');
 if(beforeCls==='CANCELLED')throw Error('Supplier order is cancelled; no payment sent');
 if(before.shippingZip!==b.plan.address.postalCode)throw Error('Exact unpaid supplier destination requires review before payment');
 if(beforeEvidence.providerStatus==='CREATED'){const cart=await request('shopping/order/addCart',token,{cjOrderIdList:[b.supplierOrderId]});addedSingleOrder(cart,b.supplierOrderId);}
 if(beforeEvidence.providerStatus!=='UNPAID'){const conf=await request('shopping/order/addCartConfirm',token,{cjOrderIdList:[b.supplierOrderId]});if(confirmedSingleShipment(conf)!==b.quote.shipmentOrderId)throw Error('Supplier confirmation changed the parent shipment; a new reviewed approval is required');}
 // Fresh quote inside this run: no validity window is invented from
 // payExpireTime, and payment follows generation immediately.
 const parentRaw=await request('shopping/order/saveGenerateParentOrder',token,{shipmentOrderId:b.quote.shipmentOrderId});
 const fresh=supplierFundingQuote(parentRaw,b.supplierOrderId,b.quote.shipmentOrderId);
 quoteMatchesReviewedApproval(b.quote,fresh,approvedCents);
 const quoteDigest=lifecycleResponseDigest(parentRaw);
 // Claim once. Everything after this point records evidence, never blind retry.
 await prisma.$transaction(async tx=>{
  const checked=await claimBindingTx(tx,orderId);
  if(checked.digest!==b.digest||checked.supplierOrderId!==b.supplierOrderId)throw Error('Supplier binding changed before payment');
  try{
   await tx.$executeRaw`INSERT INTO "SupplierFundingExecution"("orderId","planDigest","supplierOrderId","shipmentOrderId","payId","approvedAmountUsd","approvedBy","quoteDigest",state,attempts) VALUES (${orderId}::uuid,${b.digest},${b.supplierOrderId},${fresh.shipmentOrderId},${fresh.payId},${fresh.paymentInformation.payableAmount},${admin},${quoteDigest},'PAY_REQUESTED',1)`;
  }catch{throw Error('Supplier funding execution already recorded; review its exact state before any new attempt');}
 });
 const pair={shipmentOrderId:fresh.shipmentOrderId,payId:fresh.payId};
 async function payAttempt(p:{shipmentOrderId:string;payId:string}):Promise<{outcome:PayOutcome;digest:string}>{
  let r:Response;
  try{r=await fetch(BASE+'shopping/pay/payBalanceV2',{method:'POST',headers:{'Content-Type':'application/json','CJ-Access-Token':token},body:JSON.stringify({shipmentOrderId:p.shipmentOrderId,payId:p.payId}),signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});}
  catch{return{outcome:{kind:'ambiguous'},digest:lifecycleResponseDigest({transport:'unconfirmed'})};}
  let raw:unknown;try{raw=await r.json();}catch{return{outcome:{kind:'ambiguous'},digest:lifecycleResponseDigest({http:r.status,unparseable:true})};}
  if(!r.ok)return{outcome:{kind:'ambiguous'},digest:lifecycleResponseDigest({http:r.status,body:raw??null})};
  return{outcome:classifyPayBalanceResponse(raw),digest:lifecycleResponseDigest(raw)};
 }
 async function readFundingState():Promise<{cls:FundingObservation;detail:unknown;evidence:CJLifecycleEvidence}|null>{
  try{
   const detail=await request('shopping/order/getOrderDetail?orderId='+encodeURIComponent(b.supplierOrderId),token);
   const evidence=assessCJLifecycle(b.plan,b.supplierOrderId,detail,null,new Date());
   return{cls:classifyFundingState(evidence.state),detail,evidence};
  }catch{return null;}
 }
 async function transition(sqlState:'PAY_UNKNOWN'|'RETRY_REQUESTED'|'PAID'|'HOLD_REVIEW',from:readonly string[],fields:{payResponseDigest?:string;expirySignalled?:boolean;confirmationDigest?:string;holdReason?:string;retry?:{shipmentOrderId:string;payId:string;quoteDigest:string}|'SAME'}){
  await prisma.$transaction(async tx=>{
   const c=await coreBindingTx(tx,orderId);
   if(c.digest!==b.digest||c.supplierOrderId!==b.supplierOrderId)throw Error('Supplier binding changed during funding execution');
   const changed=await tx.$executeRaw`
    UPDATE "SupplierFundingExecution" SET
     state=${sqlState},
     attempts=CASE WHEN ${sqlState}='RETRY_REQUESTED' THEN 2 ELSE attempts END,
     regenerated=CASE WHEN ${sqlState}='RETRY_REQUESTED' THEN ${fields.retry!=='SAME'&&fields.retry!==undefined} ELSE regenerated END,
     "retryShipmentOrderId"=CASE WHEN ${sqlState}='RETRY_REQUESTED' AND ${fields.retry!=='SAME'&&fields.retry!==undefined} THEN ${fields.retry==='SAME'||fields.retry===undefined?null:fields.retry.shipmentOrderId} ELSE "retryShipmentOrderId" END,
     "retryPayId"=CASE WHEN ${sqlState}='RETRY_REQUESTED' AND ${fields.retry!=='SAME'&&fields.retry!==undefined} THEN ${fields.retry==='SAME'||fields.retry===undefined?null:fields.retry.payId} ELSE "retryPayId" END,
     "retryQuoteDigest"=CASE WHEN ${sqlState}='RETRY_REQUESTED' AND ${fields.retry!=='SAME'&&fields.retry!==undefined} THEN ${fields.retry==='SAME'||fields.retry===undefined?null:fields.retry.quoteDigest} ELSE "retryQuoteDigest" END,
     "payResponseDigest"=COALESCE(${fields.payResponseDigest??null},"payResponseDigest"),
     "expirySignalled"=CASE WHEN ${sqlState}='PAY_UNKNOWN' THEN ${fields.expirySignalled??false} ELSE "expirySignalled" END,
     "confirmationDigest"=COALESCE(${fields.confirmationDigest??null},"confirmationDigest"),
     "holdReason"=COALESCE(${fields.holdReason??null},"holdReason")
    WHERE "orderId"=${orderId}::uuid AND state IN (${from[0]},${from[1]??from[0]},${from[2]??from[0]})`;
   if(changed!==1)throw Error('Supplier funding execution state changed concurrently; review required');
  });
 }
 async function finishPaid(s:{detail:unknown;evidence:CJLifecycleEvidence},p:{shipmentOrderId:string;payId:string},attempts:number):Promise<FundingExecutionResult>{
  const confirmationDigest=lifecycleResponseDigest(s.detail);
  await prisma.$transaction(async tx=>{
   const c=await coreBindingTx(tx,orderId);
   if(c.digest!==b.digest||c.supplierOrderId!==b.supplierOrderId)throw Error('Supplier binding changed during funding execution');
   const changed=await tx.$executeRaw`UPDATE "SupplierFundingExecution" SET state='PAID',"confirmationDigest"=${confirmationDigest} WHERE "orderId"=${orderId}::uuid AND state IN ('PAY_REQUESTED','PAY_UNKNOWN','RETRY_REQUESTED')`;
   if(changed!==1)throw Error('Supplier funding execution state changed concurrently; review required');
   await persistSupplierLifecycleTx(tx,{orderId,planDigest:b.digest,supplierOrderId:b.supplierOrderId,observedAt:new Date(),evidence:s.evidence,responseDigest:lifecycleResponseDigest({detail:s.detail,tracking:null})});
  });
  return{state:'PAID',message:'Supplier payment confirmed by the provider order state. The exact payment pair and confirmation evidence are recorded.',shipmentOrderId:p.shipmentOrderId,payId:p.payId,attempts};
 }
 async function hold(reason:string,p:{shipmentOrderId:string;payId:string},attempts:number,payResponseDigest?:string):Promise<FundingExecutionResult>{
  await transition('HOLD_REVIEW',['PAY_REQUESTED','PAY_UNKNOWN','RETRY_REQUESTED'],{holdReason:reason,payResponseDigest});
  return{state:'HOLD_REVIEW',message:'Supplier funding held for review: '+reason+'. No further payment attempt will run automatically.',shipmentOrderId:p.shipmentOrderId,payId:p.payId,attempts};
 }
 // Attempt 1 with the exact freshly generated pair.
 const first=await payAttempt(pair);
 if(first.outcome.kind==='success'){
  const s=await readFundingState();
  if(s?.cls==='PAID')return finishPaid(s,pair,1);
  if(s?.cls==='UNPAID')return hold('PAY_SUCCESS_BUT_SUPPLIER_UNPAID',pair,1,first.digest);
  if(s?.cls==='CANCELLED')return hold('SUPPLIER_CANCELLED_AFTER_PAYMENT_SIGNAL',pair,1,first.digest);
  await transition('PAY_UNKNOWN',['PAY_REQUESTED'],{payResponseDigest:first.digest});
  return{state:'PAY_UNKNOWN',message:'Supplier reported payment success but the provider order state could not be confirmed. The exact pair is recorded; no retry will run without a confirmed-unpaid read.',shipmentOrderId:pair.shipmentOrderId,payId:pair.payId,attempts:1};
 }
 // Error or transport-ambiguous: record, then reconcile before any retry.
 await transition('PAY_UNKNOWN',['PAY_REQUESTED'],{payResponseDigest:first.digest,expirySignalled:first.outcome.kind==='error'&&first.outcome.expirySignalled});
 const s1=await readFundingState();
 if(!s1)return{state:'PAY_UNKNOWN',message:'Supplier payment outcome unconfirmed and the provider state is unreadable. The exact pair is recorded; held without retry.',shipmentOrderId:pair.shipmentOrderId,payId:pair.payId,attempts:1};
 if(s1.cls==='PAID')return finishPaid(s1,pair,1);
 if(s1.cls==='CANCELLED')return hold('SUPPLIER_CANCELLED',pair,1,first.digest);
 // Confirmed unpaid: exactly one grounded retry. Vendor-sanctioned regeneration
 // only on the vendor's explicit expiry error, bound to the same parent and the
 // exact approved amount; otherwise the same pair, which cannot double-charge.
 let retryPair=pair,retryQuoteDigest:string|null=null;
 if(first.outcome.kind==='error'&&first.outcome.expirySignalled){
  const parentRaw2=await request('shopping/order/saveGenerateParentOrder',token,{shipmentOrderId:b.quote.shipmentOrderId});
  const fresh2=supplierFundingQuote(parentRaw2,b.supplierOrderId,b.quote.shipmentOrderId);
  quoteMatchesReviewedApproval(b.quote,fresh2,approvedCents);
  retryPair={shipmentOrderId:fresh2.shipmentOrderId,payId:fresh2.payId};retryQuoteDigest=lifecycleResponseDigest(parentRaw2);
 }
 await transition('RETRY_REQUESTED',['PAY_UNKNOWN'],retryQuoteDigest?{retry:{...retryPair,quoteDigest:retryQuoteDigest}}:{retry:'SAME'});
 const second=await payAttempt(retryPair);
 const s2=await readFundingState();
 if(s2?.cls==='PAID')return finishPaid(s2,retryPair,2);
 if(s2?.cls==='UNPAID')return hold('SUPPLIER_UNPAID_AFTER_CONFIRMED_RETRY',retryPair,2,second.digest);
 if(s2?.cls==='CANCELLED')return hold('SUPPLIER_CANCELLED',retryPair,2,second.digest);
 await transition('PAY_UNKNOWN',['RETRY_REQUESTED'],{payResponseDigest:second.digest,expirySignalled:second.outcome.kind==='error'&&second.outcome.expirySignalled});
 return{state:'PAY_UNKNOWN',message:'Supplier payment outcome remains unconfirmed after the single grounded retry. The exact pair is recorded; held without further retry.',shipmentOrderId:retryPair.shipmentOrderId,payId:retryPair.payId,attempts:2};
}

/** Read-only recovery for an unconfirmed or interrupted execution. Resolves
 * PAY_REQUESTED/PAY_UNKNOWN from the provider order state only. It never pays,
 * never retries, and never regenerates a payment. */
export async function reviewSupplierFundingExecution(orderId:string):Promise<FundingExecutionResult>{
 if(process.env.CJ_FUNDING_EXECUTION_ENABLED!=='true')throw Error('Supplier funding execution is OFF');
 const key=process.env.CJ_API_KEY||process.env.FULFILLMENT_API_KEY;if(!key)throw Error('Supplier credentials unavailable');
 const rows=await prisma.$queryRaw<{state:string;planDigest:string;supplierOrderId:string;shipmentOrderId:string;payId:string;attempts:number}[]>`SELECT state,"planDigest","supplierOrderId","shipmentOrderId","payId",attempts FROM "SupplierFundingExecution" WHERE "orderId"=${orderId}::uuid`;
 if(rows.length!==1)throw Error('No supplier funding execution recorded');
 const row=rows[0];
 if(row.state==='PAID'||row.state==='HOLD_REVIEW')return{state:row.state,message:row.state==='PAID'?'Supplier payment was already confirmed by the provider order state.':'Supplier funding is already held for review: no automatic action.',shipmentOrderId:row.shipmentOrderId,payId:row.payId,attempts:row.attempts};
 const plan=await prisma.$transaction(tx=>loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'}));
 if(supplierPlanDigest(plan)!==row.planDigest)throw Error('Supplier binding changed; funding execution requires review');
 async function read(path:string,token:string){const r=await fetch(BASE+path,{headers:{'CJ-Access-Token':token},signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});const v=await r.json();if(!r.ok||v.result!==true||(v.code!==undefined&&v.code!==200))throw Error('Supplier read unavailable; execution state unchanged');return v.data;}
 const auth=await fetch(BASE+'authentication/getAccessToken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key}),signal:AbortSignal.timeout(10000)});
 const token=await auth.json();if(!auth.ok||token.result!==true||(token.code!==undefined&&token.code!==200)||typeof token.data?.accessToken!=='string'||!token.data.accessToken.trim())throw Error('Supplier authentication unavailable');
 const detail=await read('shopping/order/getOrderDetail?orderId='+encodeURIComponent(row.supplierOrderId),token.data.accessToken);
 const evidence=assessCJLifecycle(plan,row.supplierOrderId,detail,null,new Date());
 const cls=classifyFundingState(evidence.state);
 if(cls==='PAID'){
  const confirmationDigest=lifecycleResponseDigest(detail);
  await prisma.$transaction(async tx=>{
   if(supplierPlanDigest(await loadSupplierOrderPlanTx(tx,{orderId,requirePaid:true,now:new Date(),maxAgeMs:600000,purpose:'READ_ONLY_LIFECYCLE'}))!==row.planDigest)throw Error('Supplier binding changed; funding execution requires review');
   const changed=await tx.$executeRaw`UPDATE "SupplierFundingExecution" SET state='PAID',"confirmationDigest"=${confirmationDigest} WHERE "orderId"=${orderId}::uuid AND state IN ('PAY_REQUESTED','PAY_UNKNOWN')`;
   if(changed!==1)throw Error('Supplier funding execution state changed concurrently; review required');
   await persistSupplierLifecycleTx(tx,{orderId,planDigest:row.planDigest,supplierOrderId:row.supplierOrderId,observedAt:new Date(),evidence,responseDigest:lifecycleResponseDigest({detail,tracking:null})});
  });
  return{state:'PAID',message:'Supplier payment confirmed by the provider order state. Confirmation evidence recorded.',shipmentOrderId:row.shipmentOrderId,payId:row.payId,attempts:row.attempts};
 }
 const reason=cls==='CANCELLED'?'SUPPLIER_CANCELLED':'SUPPLIER_UNPAID_EXECUTION_INCOMPLETE';
 await prisma.$transaction(async tx=>{
  const changed=await tx.$executeRaw`UPDATE "SupplierFundingExecution" SET state='HOLD_REVIEW',"holdReason"=${reason} WHERE "orderId"=${orderId}::uuid AND state IN ('PAY_REQUESTED','PAY_UNKNOWN')`;
  if(changed!==1)throw Error('Supplier funding execution state changed concurrently; review required');
 });
 return{state:'HOLD_REVIEW',message:'Supplier funding held for review: '+reason+'. No further payment attempt will run automatically.',shipmentOrderId:row.shipmentOrderId,payId:row.payId,attempts:row.attempts};
}
