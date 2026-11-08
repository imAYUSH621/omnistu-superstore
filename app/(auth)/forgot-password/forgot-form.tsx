'use client';

import {useStoreLanguage} from '@/hooks/use-store-language';
import {AUTH_COPY,authMessage} from '@/lib/auth-language';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestReset } from '@/lib/actions/password-reset.actions';

export default function ForgotForm({ available }: { available: boolean }) {
  const language=useStoreLanguage(),c=AUTH_COPY[language];
  const [data, action, pending] = useActionState(requestReset, { success: false, message: '' });
  return (
    <form lang={language.toLowerCase()} action={action} className='space-y-4'>
      <div>
        <Label htmlFor='email'>{c.email}</Label>
        <Input id='email' name='email' type='email' required autoComplete='email' disabled={!available} />
      </div>
      <Button disabled={pending || !available} className='w-full'>{pending ? c.working : c.requestReset}</Button>
      {!available && (
        <p className='text-sm text-center text-muted-foreground' role='status'>
          {c.resetUnavailable}
        </p>
      )}
      {data.message && <p className='text-sm text-center text-muted-foreground' role='status'>{authMessage(data.message,language)}</p>}
    </form>
  );
}
