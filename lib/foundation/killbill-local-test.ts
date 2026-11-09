import type {CurrentCustomerResult} from './current-customer';
type Env=Record<string,string|undefined>;
type Config={base:string;headers:Record<string,string>};
/** Local qualification ONLY. Not a hosted billing grant or a customer issuer. */
export function localBillingConfig(env:Env=process.env):Config|null{
 if(env.VERCEL_ENV||env.OMNISTU_LOCAL_DB_TEST!=='true'||env.SHARED_BILLING_LOCAL_TEST_ONLY!=='true')return null;
 try{const db=new URL(env.DATABASE_URL??'');const base=new URL(env.KILLBILL_LOCAL_URL??'');if(!['postgres:','postgresql:'].includes(db.protocol)||!['127.0.0.1','localhost','[::1]'].includes(db.hostname)||!/^\/omnistu_test_[a-zA-Z0-9_]+$/.test(db.pathname)||base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname)||base.pathname!=='/'||base.username||base.password||base.search||base.hash)return null;
 const{KILLBILL_LOCAL_USERNAME:user,KILLBILL_LOCAL_PASSWORD:password,KILLBILL_LOCAL_TENANT_KEY:key,KILLBILL_LOCAL_TENANT_SECRET:secret}=env;if(!user||!password||!key||!secret)return null;
 return{base:base.origin,headers:{Authorization:'Basic '+Buffer.from(user+':'+password).toString('base64'),'X-Killbill-ApiKey':key,'X-Killbill-ApiSecret':secret,Accept:'application/json'}};
 }catch{return null}
}
export type BillingRead={status:'guest'|'unavailable'|'disabled'|'not-linked'}|{status:'ready';testOnly:true;source:'killbill';currency:string;balance:string;credit:string;invoiceCount:number;invoices:{id:string;date:string;status:string;currency:string;amount:string;balance:string}[]};
const decimal=(v:unknown):string|null=>{if(typeof v!=='string'&&typeof v!=='number')return null;const s=String(v);return /^-?\d+(\.\d+)?$/.test(s)&&Number.isFinite(Number(s))?s:null};
/** Existing verified User UUID is the sole external key. No email matching,
 * request identity selectors, auto-enrolment, writes, subscriptions or payment. */
export async function readLocalBilling(identity:CurrentCustomerResult,env:Env=process.env,request:typeof fetch=fetch):Promise<BillingRead>{
 if(identity.status==='guest'||identity.status==='not-found')return{status:'guest'};
 if(identity.status!=='authenticated')return{status:'unavailable'};
 const config=localBillingConfig(env);if(!config)return{status:'disabled'};
 const uuid=identity.customer.customerId;if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(uuid))return{status:'unavailable'};
 const externalKey='authjs:'+uuid;
 try{const q=new URLSearchParams({externalKey,accountWithBalanceAndCBA:'true'});const r=await request(config.base+'/1.0/kb/accounts?'+q,{headers:config.headers,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(4000)});if(r.status===404)return{status:'not-linked'};if(!r.ok)return{status:'unavailable'};const a=await r.json();const balance=decimal(a.accountBalance),credit=decimal(a.accountCBA);if(a.externalKey!==externalKey||typeof a.accountId!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(a.accountId)||!/^([A-Z]{3})$/.test(a.currency)||balance===null||credit===null)return{status:'unavailable'};
 const ir=await request(config.base+'/1.0/kb/accounts/'+a.accountId+'/invoices?includeInvoiceComponents=true',{headers:config.headers,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(4000)});if(!ir.ok)return{status:'unavailable'};const invoices=await ir.json();if(!Array.isArray(invoices)||invoices.length>100||invoices.some(i=>i.accountId!==a.accountId||typeof i.invoiceId!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(i.invoiceDate)||!['DRAFT','COMMITTED','VOID'].includes(i.status)||i.currency!==a.currency||decimal(i.amount)===null||decimal(i.balance)===null))return{status:'unavailable'};
 return{status:'ready',testOnly:true,source:'killbill',currency:a.currency,balance:balance!,credit:credit!,invoiceCount:invoices.length,invoices:invoices.map(i=>({id:i.invoiceId,date:i.invoiceDate,status:i.status,currency:i.currency,amount:decimal(i.amount)!,balance:decimal(i.balance)!}))};
 }catch{return{status:'unavailable'}}
}
