import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ForgotForm from './forgot-form';
import { resolveMailTransport } from '@/lib/mail/transport';

// Transport is runtime configuration, not build-time cached availability.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  const available = resolveMailTransport() !== null;
  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader className='space-y-2'>
          <CardTitle className='text-center'>Forgot password</CardTitle>
          <CardDescription className='text-center'>Enter your account email.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <ForgotForm available={available} />
          <div className='text-sm text-center'>
            <Link href='/sign-in' className='link'>Back to sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
