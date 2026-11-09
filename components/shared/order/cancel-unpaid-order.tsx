'use client';
import {useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {SUPPLIER_CANCELLATION_COPY} from '@/lib/supplier-cancellation-copy';
import {cancelMyUnattemptedSupplierOrder} from '@/lib/actions/order.actions';
export function CancelledUnpaidOrderNotice(){const t=SUPPLIER_CANCELLATION_COPY[useStoreLanguage()];return <p role='status' className='rounded-md border p-4 text-sm'>{t.done}</p>}
export default function CancelUnpaidOrder({orderId,onAttempt,onCancelled}:{orderId:string;onAttempt?:()=>void;onCancelled?:()=>void}){
 const t=SUPPLIER_CANCELLATION_COPY[useStoreLanguage()],router=useRouter();const[pending,start]=useTransition();const[result,setResult]=useState<'done'|'failed'|null>(null);
 return <div className='space-y-2 border-t pt-4'>
  <p className='text-sm text-muted-foreground'>{t.note}</p>
  <Button type='button' variant='outline' disabled={pending||result==='done'} onClick={()=>{onAttempt?.();start(async()=>{try{const r=await cancelMyUnattemptedSupplierOrder(orderId);setResult(r.success?'done':'failed');if(r.success){onCancelled?.();router.refresh()}}catch{setResult('failed')}})}}>{pending?t.pending:t.button}</Button>
  {result&&<p role={result==='failed'?'alert':'status'} className='text-sm'>{t[result]}</p>}
 </div>;
}
