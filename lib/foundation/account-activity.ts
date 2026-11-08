import type {CurrentCustomerResult} from './current-customer';
import {isSimulatedOrder} from '../order-simulation';
export const ACCOUNT_ACTIVITY_LIMIT=3;
export type ActivityOrderRow={id:string;userId:string;createdAt:Date;totalPrice:unknown;isPaid:boolean;paymentMethod:string;paymentNote:string|null};
export type ActivityEnquiryRow={id:string;userId:string|null;createdAt:Date;serviceSlug:string|null;status:string;message:string};
export type ActivityReaders={orders:(userId:string)=>Promise<ActivityOrderRow[]>;support:(userId:string)=>Promise<ActivityEnquiryRow[]>};
type Section<T>={status:'available';items:T[]}|{status:'unavailable';items:[]};
export type OrderActivity={id:string;createdAt:string;totalPrice:string;currency:'USD';isPaid:boolean;simulated:boolean};
export type SupportActivity={id:string;createdAt:string;serviceSlug:string|null;status:string;message:string};
export type AccountActivity={status:'available';customerId:string;store:Section<OrderActivity>;support:Section<SupportActivity>}|{status:'guest'|'unavailable';customerId:null};
function date(d:Date){const s=d.toISOString();return s;}
/** Fixed same-app adapters, not membership grants, shared billing or external services.
 * The caller supplies ONLY the independently verified current-customer result.
 * Neither email matching nor request-supplied customer/product selectors exist. */
export async function resolveAccountActivity(identity:CurrentCustomerResult,readers:ActivityReaders):Promise<AccountActivity>{
 if(identity.status==='guest'||identity.status==='not-found')return{status:'guest',customerId:null};
 if(identity.status!=='authenticated')return{status:'unavailable',customerId:null};
 const id=identity.customer.customerId;
 const [store,support]=await Promise.allSettled([
  Promise.resolve().then(()=>readers.orders(id)).then(rows=>rows.slice(0,ACCOUNT_ACTIVITY_LIMIT).map(r=>{if(r.userId!==id)throw Error('scope');const total=Number(r.totalPrice);if(!Number.isFinite(total)||total<0)throw Error('total');return{id:r.id,createdAt:date(r.createdAt),totalPrice:total.toFixed(2),currency:'USD' as const,isPaid:r.isPaid,simulated:isSimulatedOrder(r)}})),
  Promise.resolve().then(()=>readers.support(id)).then(rows=>rows.slice(0,ACCOUNT_ACTIVITY_LIMIT).map(r=>{if(r.userId!==id)throw Error('scope');return{id:r.id,createdAt:date(r.createdAt),serviceSlug:r.serviceSlug,status:r.status,message:r.message}})),
 ]);
 return{status:'available',customerId:id,store:store.status==='fulfilled'?{status:'available',items:store.value}:{status:'unavailable',items:[]},support:support.status==='fulfilled'?{status:'available',items:support.value}:{status:'unavailable',items:[]}};
}
