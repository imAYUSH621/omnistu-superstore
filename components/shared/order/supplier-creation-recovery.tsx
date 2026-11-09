'use client';
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {recoverSupplierCreationAction} from '@/lib/actions/supplier-creation.actions';
export function SupplierCreationRecoveryPanel({enabled,state,message,pending=false,check}:{enabled:boolean;state:string|null;message?:string;pending?:boolean;check?:()=>void}){
 const uncertain=state==='UNKNOWN'||state==='REQUESTED';
 return <section className='mt-4 space-y-3 rounded-md border p-3 text-sm' aria-label='Supplier creation outcome'>
  <h3 className='font-semibold'>Supplier creation outcome</h3>
  <p>Check an uncertain order by its saved store order number. This does not create another supplier order or make a payment.</p>
  <p className='break-words'>Saved attempt: {state??'not found'}.</p>
  {uncertain?<p className='text-amber-800 dark:text-amber-300'>Do not resubmit. A missing result is not proof that creation failed. Exact supplier and merchant line identity, destination and unpaid state must be verified before binding a recovered order.</p>:null}
  {!enabled?<p role='status'>Supplier creation recovery is not enabled.</p>:uncertain?<Button type='button' onClick={check} disabled={pending} className='h-auto min-h-10 w-full whitespace-normal'>{pending?'Checking existing supplier order...':'Check existing supplier order'}</Button>:null}
  {message?<p role='status' className='break-words'>{message}</p>:null}
 </section>;
}
export default function SupplierCreationRecovery({orderId,enabled,initialState}:{orderId:string;enabled:boolean;initialState:string|null}){
 const [state,setState]=useState(initialState),[message,setMessage]=useState(''),[pending,start]=useTransition();
 return <SupplierCreationRecoveryPanel enabled={enabled} state={state} message={message} pending={pending} check={()=>start(async()=>{const r=await recoverSupplierCreationAction(orderId);setMessage(r.message);if(r.success)setState('ACCEPTED');})}/>;
}
