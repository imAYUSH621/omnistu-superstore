'use client';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{QUALIFIED_SELECTION_COPY}from '@/lib/qualified-selection-language';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { addQualifiedCartAction } from '@/lib/actions/qualified-retail.actions';
type Option={lineKey:string;snapshotId:string;variantId:string;label:string;price:string;maxQty:number};
export default function QualifiedBuyBox({options,signedIn,status='available'}:{options:Option[];signedIn:boolean;status?:'available'|'destination-required'|'unavailable'}) {
 const language=useStoreLanguage(),copy=QUALIFIED_SELECTION_COPY[language];
 const [selected,setSelected]=useState('');const[qty,setQty]=useState(1);const[message,setMessage]=useState('');const[pending,start]=useTransition();const router=useRouter();const option=options.find(o=>o.lineKey===selected);
 return <section className='rounded-xl border bg-card p-5 space-y-4' aria-label={copy.title}>
  <p className='rounded-md bg-sky-50 p-3 text-sm text-sky-950'>{copy.test}</p>
  {!signedIn?<Link className='underline' href='/sign-in'>{copy.signIn}</Link>:status==='unavailable'?<p role='alert'>{copy.unavailable}</p>:status==='destination-required'?<p>{copy.destination} <Link className='underline' href='/shipping-address'>{copy.review}</Link>.</p>:!options.length?<p>{copy.noOffer} <Link className='underline' href='/shipping-address'>{copy.review}</Link>.</p>:<>
   <label className='block text-sm font-medium'>{copy.option}<select className='mt-2 w-full rounded-md border bg-background p-3' value={selected} onChange={e=>{setSelected(e.target.value);setQty(1);setMessage('');}}><option value=''>{copy.choose}</option>{options.map(o=><option key={o.lineKey} value={o.lineKey}>{o.label}</option>)}</select></label>
   {option&&<><p className='text-2xl font-semibold'>${option.price} <span className='text-sm font-normal'>{copy.unit}</span></p><label className='block text-sm'>{copy.qty}<select className='ml-3 rounded-md border bg-background p-2' value={qty} onChange={e=>setQty(Number(e.target.value))}>{Array.from({length:Math.min(option.maxQty,100)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label></>}
   <Button className='w-full' disabled={!option||pending} onClick={()=>start(async()=>{if(!option)return;const r=await addQualifiedCartAction({lineKey:option.lineKey,snapshotId:option.snapshotId,qty});setMessage(r.success?copy.added:copy.refused);if(r.success)router.push('/cart');})}>{pending?copy.adding:copy.add}</Button>
  </>}
  <p role='status' className='text-sm'>{message}</p>
 </section>;
}
