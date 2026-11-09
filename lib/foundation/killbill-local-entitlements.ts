import type {CurrentCustomerResult} from './current-customer';
import {localBillingConfig} from './killbill-local-test';
type Env=Record<string,string|undefined>;
type Subscription={id:string;bundleId:string;plan:string;product:string;state:'ACTIVE'|'BLOCKED'|'CANCELLED'|'PENDING'};
export type LocalEntitlements={status:'guest'|'disabled'|'unavailable'|'not-linked'}|{status:'ready';testOnly:true;source:'killbill';serviceProvisioned:false;subscriptions:Subscription[]};
const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
const name=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0&&x.length<=200;
/** Reads upstream subscription state only. ACTIVE is not a service grant,
 * payment receipt or paid entitlement. No product mapping or provisioning. */
export async function readLocalEntitlements(identity:CurrentCustomerResult,env:Env=process.env,request:typeof fetch=fetch):Promise<LocalEntitlements>{
 if(identity.status==='guest'||identity.status==='not-found')return{status:'guest'};
 if(identity.status!=='authenticated')return{status:'unavailable'};
 const config=localBillingConfig(env);if(!config)return{status:'disabled'};
 const id=identity.customer.customerId;if(!uuid(id))return{status:'unavailable'};
 const key='authjs:'+id;
 try{
  const options={headers:config.headers,cache:'no-store' as const,redirect:'error' as const,signal:AbortSignal.timeout(4000)};
  const ar=await request(config.base+'/1.0/kb/accounts?'+new URLSearchParams({externalKey:key}),options);
  if(ar.status===404)return{status:'not-linked'};if(!ar.ok)return{status:'unavailable'};
  const a=await ar.json();if(!a||a.externalKey!==key||!uuid(a.accountId))return{status:'unavailable'};
  const br=await request(config.base+'/1.0/kb/accounts/'+a.accountId+'/bundles',{...options,signal:AbortSignal.timeout(4000)});
  if(!br.ok)return{status:'unavailable'};const bundles=await br.json();if(!Array.isArray(bundles)||bundles.length>100)return{status:'unavailable'};
  const subscriptions:Subscription[]=[],ids=new Set<string>(),bundleIds=new Set<string>();
  for(const b of bundles){
   if(!b||b.accountId!==a.accountId||!uuid(b.bundleId)||bundleIds.has(b.bundleId)||!Array.isArray(b.subscriptions)||b.subscriptions.length>100)return{status:'unavailable'};
   bundleIds.add(b.bundleId);
   for(const s of b.subscriptions){
    if(!s||s.accountId!==a.accountId||s.bundleId!==b.bundleId||!uuid(s.subscriptionId)||ids.has(s.subscriptionId)||!name(s.planName)||!name(s.productName)||!['ACTIVE','BLOCKED','CANCELLED','PENDING'].includes(s.state)||subscriptions.length>=100)return{status:'unavailable'};
    ids.add(s.subscriptionId);subscriptions.push({id:s.subscriptionId,bundleId:b.bundleId,plan:s.planName,product:s.productName,state:s.state});
   }
  }
  return{status:'ready',testOnly:true,source:'killbill',serviceProvisioned:false,subscriptions};
 }catch{return{status:'unavailable'}}
}
