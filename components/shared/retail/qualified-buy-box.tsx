'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { addQualifiedCartAction } from '@/lib/actions/qualified-retail.actions';
type Option={lineKey:string;snapshotId:string;variantId:string;label:string;price:string;maxQty:number};
export default function QualifiedBuyBox({options,signedIn}:{options:Option[];signedIn:boolean}) {
 const [selected,setSelected]=useState('');const[qty,setQty]=useState(1);const[message,setMessage]=useState('');const[pending,start]=useTransition();const router=useRouter();const option=options.find(o=>o.lineKey===selected);
 return <section className='rounded-xl border bg-card p-5 space-y-4' aria-label='Choose your product option'>
  <p className='rounded-md bg-sky-50 p-3 text-sm text-sky-950'>TEST CHECKOUT ONLY. No real charge, supplier order or shipment.</p>
  {!signedIn?<Link className='underline' href='/sign-in'>Sign in to choose an option</Link>:!options.length?<p>No current offer is available for your saved destination. <Link className='underline' href='/shipping-address'>Review your country and postal code</Link>. A fresh approved quote is required.</p>:<>
   <label className='block text-sm font-medium'>Size and color<select className='mt-2 w-full rounded-md border bg-background p-3' value={selected} onChange={e=>{setSelected(e.target.value);setQty(1);}}><option value=''>Choose an option</option>{options.map(o=><option key={o.lineKey} value={o.lineKey}>{o.label}</option>)}</select></label>
   {option&&<><p className='text-2xl font-semibold'>${option.price} <span className='text-sm font-normal'>USD per item</span></p><label className='block text-sm'>Quantity<select className='ml-3 rounded-md border bg-background p-2' value={qty} onChange={e=>setQty(Number(e.target.value))}>{Array.from({length:Math.min(option.maxQty,100)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label></>}
   <Button className='w-full' disabled={!option||pending} onClick={()=>start(async()=>{if(!option)return;const r=await addQualifiedCartAction({lineKey:option.lineKey,snapshotId:option.snapshotId,qty});setMessage(r.message);if(r.success){router.refresh();router.push('/cart');}})}>{pending?'Adding...':'Add selected option to test cart'}</Button>
  </>}
  <p role='status' className='text-sm'>{message}</p>
 </section>;
}
