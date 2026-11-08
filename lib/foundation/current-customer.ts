import type {CustomerId} from './types';
/** A bridge to the EXISTING same-app User UUID. No new company identity issuer,
 * membership, entitlement, billing customer or cross-domain session is implied. */
export type CurrentCustomer={customerId:CustomerId;name:string;email:string;joinedAt:string;identitySource:'existing-user'};
type Row={id:string;name:string;email:string;createdAt:Date};
type ReadOwn=(id:string)=>Promise<Row|null>;
export type CurrentCustomerResult={status:'guest'|'unavailable'|'not-found';customer:null}|{status:'authenticated';customer:CurrentCustomer};
export async function resolveCurrentCustomer(session:{user?:{id?:string}}|null|undefined,readOwn:ReadOwn):Promise<CurrentCustomerResult>{
 const id=session?.user?.id;if(!id)return{status:'guest',customer:null};
 try{const row=await readOwn(id);if(!row||row.id!==id)return{status:'not-found',customer:null};
  if(!Number.isFinite(row.createdAt.getTime()))return{status:'unavailable',customer:null};
  return{status:'authenticated',customer:{customerId:row.id as CustomerId,name:row.name,email:row.email,joinedAt:row.createdAt.toISOString(),identitySource:'existing-user'}};
 }catch{return{status:'unavailable',customer:null}}
}
