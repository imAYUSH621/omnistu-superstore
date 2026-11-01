'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { reviewReturn } from '@/lib/actions/return.actions';
import { useRouter } from 'next/navigation';

export default function ReturnReviewButtons({ returnId }: { returnId: string }) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function act(approve: boolean) {
    startTransition(async () => {
      const res = await reviewReturn(returnId, approve);
      setResult(res);
      if (res.success) router.refresh();
    });
  }

  return (
    <div className='space-y-1'>
      <div className='flex gap-2'>
        <Button type='button' size='sm' onClick={() => act(true)} disabled={isPending}>
          Approve (simulated refund)
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={() => act(false)} disabled={isPending}>
          Reject
        </Button>
      </div>
      {result && (
        <p className={`text-[11px] ${result.success ? 'text-muted-foreground' : 'text-destructive'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
