'use client';

import { useState, useTransition } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestReturn } from '@/lib/actions/return.actions';

export default function ReturnRequestButton({ orderId }: { orderId: string }) {
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
    return <p className='text-xs text-muted-foreground'>{result.message}</p>;
  }

  return (
    <div className='space-y-2'>
      {!open ? (
        <Button type='button' variant='outline' className='w-full' onClick={() => setOpen(true)}>
          <RotateCcw className='w-4 h-4 mr-1.5' /> Request a return
        </Button>
      ) : (
        <div className='space-y-2'>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            minLength={10}
            placeholder='Why are you returning this order? (min 10 characters)'
            className='w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm'
          />
          <div className='flex gap-2'>
            <Button type='button' onClick={submit} disabled={isPending || reason.trim().length < 10} className='flex-1'>
              {isPending ? 'Submitting...' : 'Submit request'}
            </Button>
            <Button type='button' variant='ghost' onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {result && !result.success && <p className='text-xs text-destructive'>{result.message}</p>}
      <p className='text-[11px] text-muted-foreground'>
        Demo store: the request is recorded, but refunds are simulated and no money moves.
      </p>
    </div>
  );
}
