'use client';

import {useStoreLanguage} from '@/hooks/use-store-language';
import {AUTH_COPY,authMessage} from '@/lib/auth-language';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithCredentials } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';

const CredentialsSignInForm = () => {
  const language=useStoreLanguage(),c=AUTH_COPY[language];
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignInButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='default'>
        {pending ? c.signingIn : c.signIn}
      </Button>
    );
  };

  return (
    <form lang={language.toLowerCase()} action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label htmlFor='email'>{c.identity}</Label>
          <Input
            id='email'
            name='email'
            type='text'
            required
            autoComplete='username email'
            defaultValue={signInDefaultValues.email}
          />
        </div>
        <div>
          <Label htmlFor='password'>{c.password}</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='password'
            defaultValue={signInDefaultValues.password}
          />
        </div>
        <div>
          <SignInButton />
        </div>

        {data && !data.success && (
          <div role='alert' className='text-center text-destructive'>{authMessage(data.message,language)}</div>
        )}

        <div className='text-sm text-center'>
          <Link href='/forgot-password' className='link'>{c.forgotLink}</Link>
        </div>

        <div className='text-sm text-center text-muted-foreground'>
          {c.noAccount}{' '}
          <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`} target='_self' className='link'>
            {c.signUp}
          </Link>
        </div>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
