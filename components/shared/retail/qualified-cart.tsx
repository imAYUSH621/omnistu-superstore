'use client';
import {useState,useTransition,useRef}from'react';
import{useRouter}from'next/navigation';
import Link from'next/link';
import{Button}from'@/components/ui/button';
import{removeQualifiedCartAction,createQualifiedOrderAction}from'@/lib/actions/qualified-retail.actions';
import type{readQualifiedCart}from'@/lib/retail/store';
type Cart=Awaited<ReturnType<typeof readQualifiedCart>>;
export default function QualifiedCart({cart,checkout=false}:{cart:Cart;checkout?:boolean}){
 const[pending,start]=useTransition();const[message,setMessage]=useState('');const key=useRef<string|null>(null);const router=useRouter();
 return <main className='mx-auto max-w-4xl space-y-6 px-4 py-8'>
  <h1 className='text-2xl font-semibold'>{checkout?'Review your test order':'Your cart'}</h1>
  <p className='rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950'>TEST CHECKOUT ONLY. Simulated USD prices and zero test shipping/tax fees. No real payment, supplier order or shipment.</p>
  {!cart?.lines.length?<p>Your test cart is empty. <Link className='underline' href='/search'>Browse products</Link>.</p>:<>
   <p>Destination: {cart.country} {cart.postal}. <Link href='/shipping-address' className='underline'>Change address</Link></p>
   <div className='divide-y rounded-xl border'>{cart.lines.map(line=><article className='space-y-2 p-5' key={line.lineKey}><h2 className='font-semibold'>{line.name}</h2><p>{line.variantLabel}</p><p>Quantity: {line.qty}</p>{line.status==='current'?<p>${line.price} USD per item</p>:<p className='text-amber-800'>This option needs a fresh review. Checkout is blocked.</p>}<Button disabled={pending} variant='outline' onClick={()=>start(async()=>{const r=await removeQualifiedCartAction({cartId:cart.id,lineKey:line.lineKey,snapshotId:line.snapshotId});setMessage(r.message);if(r.success)router.refresh();})}>Remove option</Button></article>)}</div>
   {cart.total!==null&&<p className='text-xl font-semibold'>Test total: ${cart.total} USD</p>}
   {checkout?<Button disabled={pending||cart.total===null} onClick={()=>start(async()=>{key.current??=crypto.randomUUID();const r=await createQualifiedOrderAction({cartId:cart.id,reviewToken:cart.reviewToken,idempotencyKey:key.current});setMessage(r.message);if(r.success&&'redirectTo'in r)router.push(r.redirectTo);})}>{pending?'Creating test order...':'Place test order - no charge'}</Button>:<Button asChild disabled={cart.total===null}><Link href='/payment-method'>Continue to test payment</Link></Button>}
  </>}
  <p role='status'>{message}</p>
 </main>;
}
