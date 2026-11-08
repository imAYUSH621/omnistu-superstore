'use client';
import {useState,useTransition,useRef}from'react';
import{useRouter}from'next/navigation';
import Link from'next/link';
import CT from '@/components/shared/cart-text';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {CART_COPY} from '@/lib/cart-language';
import{Button}from'@/components/ui/button';
import{removeQualifiedCartAction,createQualifiedOrderAction}from'@/lib/actions/qualified-retail.actions';
import type{readQualifiedCart}from'@/lib/retail/store';
type Cart=Awaited<ReturnType<typeof readQualifiedCart>>;
export default function QualifiedCart({cart,checkout=false}:{cart:Cart;checkout?:boolean}){
 const language=useStoreLanguage();const t=CART_COPY[language];
 const[pending,start]=useTransition();const[message,setMessage]=useState('');const key=useRef<string|null>(null);const router=useRouter();
 return <main className='mx-auto max-w-4xl space-y-6 px-4 py-8'>
  <h1 className='text-2xl font-semibold'>{checkout?t.reviewTitle:t.title}</h1>
  <p className='rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950'><CT name='testOnly'/></p>
  {!cart?.lines.length?<p><CT name='testEmpty'/> <Link className='underline' href='/search'><CT name='browse'/></Link>.</p>:<>
   <p><CT name='destination'/>: {cart.country} {cart.postal}. <Link href='/shipping-address' className='underline'><CT name='changeAddress'/></Link></p>
   <div className='divide-y rounded-xl border'>{cart.lines.map(line=><article className='min-w-0 break-words space-y-2 p-5' key={line.lineKey}><h2 className='font-semibold'>{line.name}</h2><p>{line.variantLabel}</p><p><CT name='quantity'/>: {line.qty}</p>{line.status==='current'?<p>{line.price} <CT name='perItem'/></p>:<p className='text-amber-800'><CT name='stale'/></p>}<Button className='h-auto min-h-10 max-w-full whitespace-normal break-words text-center' disabled={pending} variant='outline' onClick={()=>start(async()=>{const r=await removeQualifiedCartAction({cartId:cart.id,lineKey:line.lineKey,snapshotId:line.snapshotId});setMessage(r.message);if(r.success)router.refresh();})}><CT name='removeOption'/></Button></article>)}</div>
   {cart.total!==null&&<p className='text-xl font-semibold'><CT name='testTotal'/>: {cart.total} USD</p>}
   {checkout?<Button className='h-auto min-h-10 max-w-full whitespace-normal break-words text-center' disabled={pending||cart.total===null} onClick={()=>start(async()=>{key.current??=crypto.randomUUID();const r=await createQualifiedOrderAction({cartId:cart.id,reviewToken:cart.reviewToken,idempotencyKey:key.current});setMessage(r.message);if(r.success&&'redirectTo'in r)router.push(r.redirectTo);})}>{pending?t.creating:t.placeTest}</Button>:cart.total===null?<Button className='h-auto min-h-10 max-w-full whitespace-normal break-words text-center' disabled><CT name='continueTest'/></Button>:<Button className='h-auto min-h-10 max-w-full whitespace-normal break-words text-center' asChild><Link href='/payment-method'><CT name='continueTest'/></Link></Button>}
  </>}
  <p role='status'>{message}</p>
 </main>;
}
