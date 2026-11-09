import Link from 'next/link';
import {prisma}from '@/db/prisma';
import {requireAdmin}from '@/lib/auth-guard';
import{loadSupportInbox,supportPageHref,SUPPORT_STATUSES,type SupportParams}from '@/lib/support-inbox';
export const metadata={title:'Support and service enquiries'};
export const dynamic='force-dynamic';
const labels={all:'All statuses',NEW:'New',IN_PROGRESS:'In progress',CLOSED:'Closed',other:'Other recorded statuses'};
export default async function EnquiriesPage({searchParams}:{searchParams?:Promise<SupportParams>}){
 const state=await loadSupportInbox(await searchParams??{},requireAdmin,{
  count:where=>prisma.serviceEnquiry.count({where}),
  list:args=>prisma.serviceEnquiry.findMany({...args,select:{id:true,serviceSlug:true,name:true,email:true,message:true,status:true,createdAt:true}})
 });
 return <div className='space-y-4'>
  <h1 className='h2-bold'>Support and service enquiries</h1>
  <p className='text-sm text-muted-foreground'>Read-only store inbox. Browse saved support and service enquiries, including older pages. Recorded status is not proof of a reply. No email is sent and no enquiry is changed here.</p>
  <form action='/admin/enquiries' method='GET' className='flex flex-wrap items-end gap-3'>
   <label className='text-sm space-y-1'><span className='block'>Recorded status</span><select name='status' defaultValue={state.filter} className='rounded border bg-background text-foreground p-2'>{SUPPORT_STATUSES.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></label>
   <button type='submit' className='rounded border bg-primary px-4 py-2 text-sm text-primary-foreground'>Apply filter</button>
   <Link href='/admin/enquiries' className='text-sm underline py-2'>Reset</Link>
  </form>
  {state.status==='unavailable'?<p role='alert' className='rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800'>Enquiries could not be loaded. Try again later. No empty inbox or total is confirmed.</p>:<>
   <p role='status' className='text-sm text-muted-foreground'>Showing {state.from}-{state.to} of {state.total} saved enquiries. Page {state.page} of {state.pages}. Counts can change when new enquiries arrive.</p>
   {state.rows.length===0?<p className='rounded border p-3 text-sm'>{state.total===0?'No enquiries match this status.':'This page changed while loading. Refresh to see the current inbox.'}</p>:<ul className='space-y-3'>{state.rows.map(r=><li key={r.id} className='space-y-1 rounded border p-3 text-sm break-words'>
    <p className='font-medium'>{r.name} <span className='font-normal break-all'>({r.email})</span></p>
    <p className='text-xs text-muted-foreground'>{r.serviceSlug??'general'} - {r.status} - {r.createdAt.toISOString().slice(0,16).replace('T',' ')} UTC</p>
    <p className='whitespace-pre-wrap break-words'>{r.message}</p>
   </li>)}</ul>}
   <nav aria-label='Enquiry pages' className='flex flex-wrap items-center gap-4 text-sm'>
    {state.page>1?<Link className='rounded border px-3 py-2' href={supportPageHref(state.page-1,state.filter)}>Previous</Link>:null}
    {state.page<state.pages?<Link className='rounded border px-3 py-2' href={supportPageHref(state.page+1,state.filter)}>Next</Link>:null}
   </nav>
  </>}
 </div>
}
