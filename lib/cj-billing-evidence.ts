import {z} from 'zod';
const id=z.string().trim().min(1).max(64);
const usd=z.union([z.string(),z.number()]).transform(String).refine(v=>/^\d+(\.\d{1,2})?$/.test(v)&&Number.isSafeInteger(Math.round(Number(v)*100)),'Exact non-negative USD required');
const utcDate=z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).refine(v=>{const d=new Date(v+'Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,19)===v;},'Valid UTC record date required');
const cents=(v:string)=>Number(v.split('.')[0])*100+Number((v.split('.')[1]??'').padEnd(2,'0'));
const row=z.object({id,cjOrderId:id,createDate:utcDate,typeDesc:z.literal('Order Payment'),copeMoney:usd,status:z.enum(['0','1','2','3','4'])});
const page=z.object({pageNum:z.literal(1),pageSize:z.literal(100),total:z.number().int().nonnegative().safe(),list:z.array(row).max(100)});
export type SupplierBillingEvidence={reviewOnly:true;retryAllowed:false;paymentAuthorization:false;paymentIdVerified:false;currency:'USD';reference:string;complete:boolean;total:number;records:{id:string;createdAt:string;amountUsd:string;status:'PENDING'|'SUCCESS'|'FAILED'|'FROZEN'|'FAILED_CANCELLED';matchesSavedQuote:boolean|null}[];assessment:'NO_MATCH_REVIEW'|'INCOMPLETE_REVIEW'|'RECORDS_REQUIRE_REVIEW'};
/** Billing record correlation is not proof of a particular payId or immutable
 * payment-parent membership. Even a complete empty result never authorizes retry.
 * Only a server-authenticated, exact-order-scoped read may call this validator. */
export function assessSupplierBilling(raw:unknown,reference:string,quoteAmount:string|null,now:Date):SupplierBillingEvidence{
 id.parse(reference);if(!Number.isFinite(now.getTime()))throw Error('Observation time unavailable');if(quoteAmount!==null)usd.parse(quoteAmount);
 const p=page.parse(raw);if(p.total<p.list.length||(p.total>0&&p.list.length===0)||new Set(p.list.map(r=>r.id)).size!==p.list.length||p.list.some(r=>r.cjOrderId!==reference||new Date(r.createDate+'Z')>now))throw Error('Supplier billing scope or chronology requires review');
 const complete=p.total===p.list.length;
 return {reviewOnly:true,retryAllowed:false,paymentAuthorization:false,paymentIdVerified:false,currency:'USD',reference,complete,total:p.total,assessment:!complete?'INCOMPLETE_REVIEW':p.total===0?'NO_MATCH_REVIEW':'RECORDS_REQUIRE_REVIEW',records:p.list.map(r=>({id:r.id,createdAt:r.createDate+'Z',amountUsd:r.copeMoney,status:({'0':'PENDING','1':'SUCCESS','2':'FAILED','3':'FROZEN','4':'FAILED_CANCELLED'}as const)[r.status],matchesSavedQuote:quoteAmount===null?null:cents(r.copeMoney)===cents(quoteAmount)}))};
}
