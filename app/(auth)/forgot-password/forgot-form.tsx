'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestReset } from '@/lib/actions/password-reset.actions';

export default function ForgotForm() {
  const [data, action, pending] = useActionState(requestReset, { success: false, message: '' });
  return (
    <form action={action} className='space-y-4'>
      <div>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' name='email' type='email' required autoComplete='email' />
      </div>
      <Button disabled={pending} className='w-full'>{pending ? 'Working...' : 'Request password reset'}</Button>
      {data.message && <p className='text-sm text-center text-muted-foreground' role='status'>{data.message}</p>}
    </form>
  );
}
