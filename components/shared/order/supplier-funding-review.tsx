'use client';
import {useState,useTransition} from 'react';
import {Button} from '@/components/ui/button';
import {prepareSupplierFundingReviewAction,executeSupplierFundingAction,reviewSupplierFundingExecutionAction} from '@/lib/actions/supplier-funding.actions';
import type {SupplierFundingQuote} from '@/lib/cj-funding-evidence';
export type SupplierFundingView={state:string;quote:SupplierFundingQuote|null}|null;
export type SupplierFundingExecutionView={state:string;attempts:number;holdReason:string|null}|null;
export type SupplierFundingApprovalView={approvedAmountUsd:string;evidenceRef:string;createdAt:string}|null;
const executionLabel=(v:SupplierFundingExecutionView)=>{
 if(!v)return null;
 if(v.state==='PAID')return {tone:'ok' as const,text:'Supplier payment confirmed by the provider order state. Evidence recorded.'};
 if(v.state==='PAY_REQUESTED')return {tone:'warn' as const,text:'Supplier payment was submitted but its outcome was never recorded. Use the re-check; no automatic retry runs.'};
 if(v.state==='PAY_UNKNOWN')return {tone:'warn' as const,text:'Supplier payment outcome is unconfirmed. The exact payment pair is recorded. Re-check the provider state; no automatic retry runs.'};
 if(v.state==='RETRY_REQUESTED')return {tone:'warn' as const,text:'One grounded retry with the identical recorded pair was submitted after a confirmed-unpaid read. Its outcome is unconfirmed. Re-check the provider state.'};
 return {tone:'warn' as const,text:'Supplier funding is held for review ('+(v.holdReason??'check required')+'). No further payment attempt will run automatically.'};
};
export function SupplierFundingReviewPanel({enabled,state,quote,pending=false,message,prepare,executionEnabled=false,execution=null,approval=null,execPending=false,execMessage,execute,reviewExecution}:{enabled:boolean;state:string|null;quote:SupplierFundingQuote|null;pending?:boolean;message?:string;prepare?:()=>void;executionEnabled?:boolean;execution?:SupplierFundingExecutionView;approval?:SupplierFundingApprovalView;execPending?:boolean;execMessage?:string;execute?:()=>void;reviewExecution?:()=>void}){
 const unknown=state!==null&&state!=='REVIEW_ONLY';
 const label=state===null?'':({CART_UNKNOWN:'cart response uncertain',CONFIRM_UNKNOWN:'confirmation response uncertain',PARENT_UNKNOWN:'final quote response uncertain',CHECK_REQUIRED:'check required',UNAVAILABLE:'saved status unavailable',SUPPLIER_PROGRESSED:'supplier order already progressed'}as Record<string,string>)[state]??'check required';
 const exec=executionLabel(execution);
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
  {exec?<p role={exec.tone==='warn'?'alert':'status'} className={exec.tone==='warn'?'break-words text-amber-800 dark:text-amber-300':'break-words'}>{exec.text}</p>:null}
  {executionEnabled&&quote&&!execution&&!approval?<div className='space-y-2 border-t pt-3'>
   <p className='font-medium'>Supplier payment unavailable</p>
   <p className='text-xs text-muted-foreground'>Paying spends the supplier balance for exactly USD {quote.paymentInformation.payableAmount}. No externally verified owner approval is recorded for this exact quote, so no payment control is available here. Approvals are written only through the operator-controlled path after the owner&apos;s authenticated approval is verified; this page cannot create one.</p>
  </div>:null}
  {executionEnabled&&quote&&!execution&&approval?<div className='space-y-2 border-t pt-3'>
   <p className='text-xs text-muted-foreground'>Owner approval recorded ({approval.evidenceRef}) for exactly USD {approval.approvedAmountUsd}. A fresh quote is generated and checked against the reviewed one; payment then runs immediately. At most one retry is allowed, only with the identical recorded pair after a confirmed-unpaid provider read.</p>
   <Button type='button' onClick={()=>execute?.()} disabled={execPending} className='h-auto min-h-10 w-full whitespace-normal'>{execPending?'Executing supplier payment...':'Pay supplier exactly USD '+approval.approvedAmountUsd+' now'}</Button>
  </div>:null}
  {executionEnabled&&execution&&(execution.state==='PAY_UNKNOWN'||execution.state==='PAY_REQUESTED'||execution.state==='RETRY_REQUESTED')?<Button type='button' onClick={reviewExecution} disabled={execPending} className='h-auto min-h-10 w-full whitespace-normal'>{execPending?'Checking provider state...':'Re-check supplier payment status'}</Button>:null}
  {execMessage?<p role='status' className='break-words'>{execMessage}</p>:null}
 </section>;
}
export default function SupplierFundingReview({orderId,enabled,initial=null,executionEnabled=false,executionInitial=null,approvalInitial=null}:{orderId:string;enabled:boolean;initial?:SupplierFundingView;executionEnabled?:boolean;executionInitial?:SupplierFundingExecutionView;approvalInitial?:SupplierFundingApprovalView}){
 const [record,setRecord]=useState(initial);const [message,setMessage]=useState('');const [pending,start]=useTransition();
 const [execution,setExecution]=useState(executionInitial);const [approval,setApproval]=useState(approvalInitial);
 const [execMessage,setExecMessage]=useState('');const [execPending,startExec]=useTransition();
 return <SupplierFundingReviewPanel enabled={enabled} state={record?.state??null} quote={record?.quote??null} pending={pending} message={message} executionEnabled={executionEnabled} execution={execution} approval={approval} execPending={execPending} execMessage={execMessage}
  prepare={()=>start(async()=>{
   const result=await prepareSupplierFundingReviewAction(orderId);setMessage(result.message);if(result.success)setRecord({state:'REVIEW_ONLY',quote:result.quote});else setRecord({state:'CHECK_REQUIRED',quote:null});
  })}
  execute={()=>startExec(async()=>{
   const result=await executeSupplierFundingAction(orderId);setExecMessage(result.message);
   if(result.success){setExecution({state:result.state,attempts:1,holdReason:null});if(result.state==='PAID')setApproval(null);}
  })}
  reviewExecution={()=>startExec(async()=>{
   const result=await reviewSupplierFundingExecutionAction(orderId);setExecMessage(result.message);
   if(result.success)setExecution({state:result.state,attempts:execution?.attempts??1,holdReason:execution?.holdReason??null});
  })}/>;
}
