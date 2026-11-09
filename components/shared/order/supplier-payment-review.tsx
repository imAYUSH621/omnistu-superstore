'use client';
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {reconcileSupplierPaymentAction} from '@/lib/actions/supplier-payment.actions';
import type {SupplierPaymentObservation} from '@/lib/supplier-payment-reconciliation';
export function SupplierPaymentReviewPanel({enabled,evidence,pending=false,message,check}:{enabled:boolean;evidence:SupplierPaymentObservation|null;pending?:boolean;message?:string;check?:()=>void}){
 return <section className='mt-4 space-y-3 rounded-md border p-3 text-sm' aria-label='Supplier payment records'>
  <h3 className='font-semibold'>Supplier payment records</h3>
  <p className='text-muted-foreground'>Read-only review of the exact supplier order and its billing records. A record does not verify a payment ID or authorize another payment.</p>
  {evidence?<div className='space-y-2'>
   <p className='text-xs text-muted-foreground break-words'>Saved observation: {evidence.observedAt} (UTC). This is not a live payment authorization.</p>
   <p className='break-words'>Reported provider status: {evidence.providerStatus}. Provider order amount: USD {evidence.providerAmountUsd}.</p>
   {!evidence.billing.complete?<p role='alert'>History is incomplete. Do not retry payment.</p>:null}
   {!evidence.billing.records.length?<p>No matching records returned. This is not proof that payment failed or that the order is unpaid. The provider may use a different parent or sub-order reference.</p>:null}
   <ul className='space-y-2'>{evidence.billing.records.map(r=><li key={r.id} className='break-words rounded border p-2'>USD {r.amountUsd} - {r.status.replaceAll('_',' ')}<br/><span className='text-xs'>{r.createdAt} (UTC). Saved quote amount: {r.matchesSavedQuote===null?'not available':r.matchesSavedQuote?'matches; exact payment ID still unverified':'does not match'}.</span></li>)}</ul>
   <p className='text-amber-800 dark:text-amber-300'>Review only. Payment retry, refund and shipment are not authorized by these records. Existing uncertain preparation is unchanged.</p>
  </div>:null}
  {!enabled?<p role='status'>Supplier payment record checks are not enabled.</p>:<Button type='button' onClick={check} disabled={pending} className='h-auto min-h-10 w-full whitespace-normal'>{pending?'Checking supplier records...':'Check supplier payment records'}</Button>}
  {message?<p role='status' className='break-words'>{message}</p>:null}
 </section>;
}
export default function SupplierPaymentReview({orderId,enabled,initial=null}:{orderId:string;enabled:boolean;initial?:SupplierPaymentObservation|null}){
 const [evidence,setEvidence]=useState(initial);const [message,setMessage]=useState('');const [pending,start]=useTransition();
 return <SupplierPaymentReviewPanel enabled={enabled} evidence={evidence} pending={pending} message={message} check={()=>start(async()=>{const r=await reconcileSupplierPaymentAction(orderId);setMessage(r.message);if(r.success)setEvidence(r.evidence);})}/>;
}
