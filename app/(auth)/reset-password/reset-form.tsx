'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/actions/password-reset.actions';

export default function ResetForm({ token }: { token: string }) {
  const [data, action, pending] = useActionState(resetPassword, { success: false, message: '' });
  return (
    <form action={action} className='space-y-4'>
      <input type='hidden' name='token' value={token} />
      <div>
        <Label htmlFor='password'>New password</Label>
        <Input id='password' name='password' type='password' required autoComplete='new-password' />
      </div>
      <div>
        <Label htmlFor='confirmPassword'>Confirm password</Label>
        <Input id='confirmPassword' name='confirmPassword' type='password' required autoComplete='new-password' />
      </div>
      <Button disabled={pending} className='w-full'>{pending ? 'Saving...' : 'Update password'}</Button>
      {data.message && (
        <p className={`text-sm text-center ${data.success ? 'text-muted-foreground' : 'text-destructive'}`} role='status'>{data.message}</p>
      )}
    </form>
  );
}
