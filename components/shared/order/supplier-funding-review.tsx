'use client';
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {prepareSupplierFundingReviewAction} from '@/lib/actions/supplier-funding.actions';
import type {SupplierFundingQuote} from '@/lib/cj-funding-evidence';
export type SupplierFundingView={state:string;quote:SupplierFundingQuote|null}|null;
export function SupplierFundingReviewPanel({enabled,state,quote,pending=false,message,prepare}:{enabled:boolean;state:string|null;quote:SupplierFundingQuote|null;pending?:boolean;message?:string;prepare?:()=>void}){
 const unknown=state!==null&&state!=='REVIEW_ONLY';
 const label=state===null?'':({CART_UNKNOWN:'cart response uncertain',CONFIRM_UNKNOWN:'confirmation response uncertain',PARENT_UNKNOWN:'final quote response uncertain',CHECK_REQUIRED:'check required',UNAVAILABLE:'saved status unavailable',SUPPLIER_PROGRESSED:'supplier order already progressed'}as Record<string,string>)[state]??'check required';
 return <section className='mt-4 space-y-3 rounded-md border p-3 text-sm' aria-label='Supplier funding review'>
  <h3 className='font-semibold'>Supplier funding review</h3>
  <p className='text-muted-foreground'>Customer payment does not fund the supplier. This action prepares a cost review only. It does not make a supplier payment.</p>
  {!enabled?<p role='status'>Supplier preparation is not enabled.</p>:null}
  {unknown?<p role='alert' className='break-words text-amber-800 dark:text-amber-300'>Supplier preparation requires review ({label}). Check the exact supplier order before any new attempt. Automatic retries are blocked.</p>:null}
  {quote?<div className='space-y-3'>
   <p className='font-medium'>Saved provider quote - review only, not payment approval</p>
   <p className='text-xs text-muted-foreground'>Provider fields are shown separately. Do not add them to the payable total.</p>
   <dl className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2'>
    {Object.entries({Payable:quote.paymentInformation.payableAmount,'Actual payment field':quote.paymentInformation.actualPayment,'Order total field':quote.orderMoney,'Products':quote.paymentInformation.orderProductAmount,'Freight':quote.paymentInformation.freight,'Service fee':quote.paymentInformation.serviceFee,'IOSS amount':quote.paymentInformation.iossAmount,'IOSS handling':quote.paymentInformation.iossTaxHandlingFee,'IOSS taxes':quote.paymentInformation.iossTaxes,'Planned balance deduction':quote.paymentInformation.balanceDeduction,'Bill amount':quote.paymentInformation.billAmount,'Product discount':quote.paymentInformation.commodityDiscount,'Postage discount':quote.paymentInformation.postageDiscount,'Coupon':quote.paymentInformation.couponAmount}).map(([label,value])=><div key={label} className='contents'><dt>{label}</dt><dd className='font-mono tabular-nums'>USD {value}</dd></div>)}
   </dl>
   <p className='break-words text-xs text-muted-foreground'>Provider expiry: {quote.payExpireTime}. The timezone has not been verified. This saved quote is not a current authorization to pay. Confirm its exact order, total, validity and cancellation terms before payment.</p>
  </div>:null}
  {enabled&&!state?<Button type='button' onClick={prepare} disabled={pending} className='h-auto min-h-10 w-full whitespace-normal'>{pending?'Preparing supplier review...':'Prepare supplier cost review'}</Button>:null}
  {message?<p role='status' className='break-words'>{message}</p>:null}
 </section>;
}
export default function SupplierFundingReview({orderId,enabled,initial=null}:{orderId:string;enabled:boolean;initial?:SupplierFundingView}){
 const [record,setRecord]=useState(initial);const [message,setMessage]=useState('');const [pending,start]=useTransition();
 return <SupplierFundingReviewPanel enabled={enabled} state={record?.state??null} quote={record?.quote??null} pending={pending} message={message} prepare={()=>start(async()=>{
  const result=await prepareSupplierFundingReviewAction(orderId);setMessage(result.message);if(result.success)setRecord({state:'REVIEW_ONLY',quote:result.quote});else setRecord({state:'CHECK_REQUIRED',quote:null});
 })}/>;
}
