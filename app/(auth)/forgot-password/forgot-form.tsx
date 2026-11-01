'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestReset } from '@/lib/actions/password-reset.actions';

export default function ForgotForm({ available }: { available: boolean }) {
  const [data, action, pending] = useActionState(requestReset, { success: false, message: '' });
  return (
    <form action={action} className='space-y-4'>
      <div>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' name='email' type='email' required autoComplete='email' disabled={!available} />
      </div>
      <Button disabled={pending || !available} className='w-full'>{pending ? 'Working...' : 'Request password reset'}</Button>
      {!available && (
        <p className='text-sm text-center text-muted-foreground' role='status'>
          Password reset is not available yet.
        </p>
      )}
      {data.message && <p className='text-sm text-center text-muted-foreground' role='status'>{data.message}</p>}
    </form>
  );
}
