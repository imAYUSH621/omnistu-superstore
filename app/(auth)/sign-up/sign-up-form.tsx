'use client';

import {useStoreLanguage} from '@/hooks/use-store-language';
import {AUTH_COPY,authMessage} from '@/lib/auth-language';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';

const SignUpForm = () => {
  const language=useStoreLanguage(),c=AUTH_COPY[language];
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignUpButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='default'>
        {pending ? c.submitting : c.signUp}
      </Button>
    );
  };

  return (
    <form lang={language.toLowerCase()} action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div>
          <Label htmlFor='name'>{c.name}</Label>
          <Input
            id='name'
            name='name'
            type='text'
            autoComplete='name'
            defaultValue={signUpDefaultValues.name}
          />
        </div>
        <div>
          <Label htmlFor='email'>{c.email}</Label>
          <Input
            id='email'
            name='email'
            type='text'
            autoComplete='email'
            defaultValue={signUpDefaultValues.email}
          />
        </div>
        <div>
          <Label htmlFor='password'>{c.password}</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            autoComplete='new-password'
            defaultValue={signUpDefaultValues.password}
          />
        </div>
        <div>
          <Label htmlFor='confirmPassword'>{c.confirmPassword}</Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            autoComplete='new-password'
            defaultValue={signUpDefaultValues.confirmPassword}
          />
        </div>
        <div>
          <SignUpButton />
        </div>

        {data && !data.success && (
          <div role='alert' className='text-center text-destructive'>{authMessage(data.message,language)}</div>
        )}

        <div className='text-sm text-center text-muted-foreground'>
          {c.hasAccount}{' '}
          <Link href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`} target='_self' className='link'>
            {c.signIn}
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
