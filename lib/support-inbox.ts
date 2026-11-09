/** Read-only support backlog. No status transition, reply, email or account
 * linking is performed here. Admin authorization is supplied by the caller
 * and always checked before counting or listing private enquiries. */
export const SUPPORT_PAGE_SIZE=25;
export const SUPPORT_STATUSES=['all','NEW','IN_PROGRESS','CLOSED','other']as const;
export type SupportFilter=typeof SUPPORT_STATUSES[number];
export type SupportParams=Record<string,string|string[]|undefined>;
export type InboxRow={id:string;serviceSlug:string|null;name:string;email:string;message:string;status:string;createdAt:Date};
export function supportPageParams(params:SupportParams){
 const raw=typeof params.page==='string'?params.page:'1';const parsed=/^[1-9]\d{0,6}$/.test(raw)?Number(raw):1;
 const status=typeof params.status==='string'&&(SUPPORT_STATUSES as readonly string[]).includes(params.status)?params.status as SupportFilter:'all';
 return{page:Math.min(parsed,1000000),status};
}
export function supportWhere(status:SupportFilter){return status==='all'?{}:status==='other'?{status:{notIn:['NEW','IN_PROGRESS','CLOSED']}}:{status};}
export function supportPageHref(page:number,status:SupportFilter){const p=Math.max(1,Math.min(1000000,Math.trunc(page)||1));return '/admin/enquiries?'+new URLSearchParams({page:String(p),status}).toString()}
export type InboxStore={count:(where:ReturnType<typeof supportWhere>)=>Promise<number>;list:(args:{where:ReturnType<typeof supportWhere>;skip:number;take:number;orderBy:({createdAt:'desc'}|{id:'desc'})[]})=>Promise<InboxRow[]>};
export async function loadSupportInbox(params:SupportParams,requireAdmin:()=>Promise<unknown>,store:InboxStore){
 await requireAdmin();
 const request=supportPageParams(params),where=supportWhere(request.status);
 try{
  const total=await store.count(where);if(!Number.isSafeInteger(total)||total<0)throw Error('INVALID_COUNT');
  const pages=Math.max(1,Math.ceil(total/SUPPORT_PAGE_SIZE)),page=Math.min(request.page,pages),rows=await store.list({where,skip:(page-1)*SUPPORT_PAGE_SIZE,take:SUPPORT_PAGE_SIZE,orderBy:[{createdAt:'desc'},{id:'desc'}]});
  return{status:'available'as const,filter:request.status,total,pages,page,rows,from:rows.length?(page-1)*SUPPORT_PAGE_SIZE+1:0,to:rows.length?(page-1)*SUPPORT_PAGE_SIZE+rows.length:0};
 }catch{return{status:'unavailable'as const,filter:request.status}}
}
