'use client';

import {useStoreLanguage} from '@/hooks/use-store-language';
import {AUTH_COPY,authMessage} from '@/lib/auth-language';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/actions/password-reset.actions';

export default function ResetForm({ token }: { token: string }) {
  const language=useStoreLanguage(),c=AUTH_COPY[language];
  const [data, action, pending] = useActionState(resetPassword, { success: false, message: '' });
  return (
    <form lang={language.toLowerCase()} action={action} className='space-y-4'>
      <input type='hidden' name='token' value={token} />
      <div>
        <Label htmlFor='password'>{c.newPassword}</Label>
        <Input id='password' name='password' type='password' required autoComplete='new-password' />
      </div>
      <div>
        <Label htmlFor='confirmPassword'>{c.confirmPassword}</Label>
        <Input id='confirmPassword' name='confirmPassword' type='password' required autoComplete='new-password' />
      </div>
      <Button disabled={pending} className='w-full'>{pending ? c.saving : c.updatePassword}</Button>
      {data.message && (
        <p className={`text-sm text-center ${data.success ? 'text-muted-foreground' : 'text-destructive'}`} role='status'>{authMessage(data.message,language)}</p>
      )}
    </form>
  );
}
