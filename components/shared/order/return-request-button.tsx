'use client';

import { useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestReturn } from '@/lib/actions/return.actions';
import {useStoreLanguage} from '@/hooks/use-store-language';
import {ORDER_DETAIL_COPY} from '@/lib/order-detail-language';

export default function ReturnRequestButton({ orderId }: { orderId: string }) {
  const copy=ORDER_DETAIL_COPY[useStoreLanguage()];
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await requestReturn(orderId, reason);
      setResult(res);
      if (res.success) setOpen(false);
    });
  }

  if (result?.success) {
    return <p className='text-xs text-muted-foreground'>{copy.returnSaved}</p>;
  }

  return (
    <div className='space-y-2'>
      {!open ? (
        <Button type='button' variant='outline' className='w-full' onClick={() => setOpen(true)}>
          <RotateCcw className='w-4 h-4 mr-1.5' /> {copy.returnLabel}
        </Button>
      ) : (
        <div className='space-y-2'>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            minLength={10}
            aria-label={copy.returnReason}
            placeholder={copy.returnReason}
            className='w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
          />
          <div className='flex gap-2'>
            <Button type='button' onClick={submit} disabled={isPending || reason.trim().length < 10} className='flex-1'>
              {isPending ? copy.submitting : copy.submit}
            </Button>
            <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
              {copy.cancel}
            </Button>
          </div>
        </div>
      )}
      {result && !result.success && <p className='text-xs text-destructive'>{copy.returnFailed}</p>}
      <p className='text-[11px] text-muted-foreground'>
        {copy.returnNote}
      </p>
    </div>
  );
}
