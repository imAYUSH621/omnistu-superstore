import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResetForm from './reset-form';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await props.searchParams;
  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader>
          <CardTitle className='text-center'>Choose a new password</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {token ? (
            <ResetForm token={token} />
          ) : (
            <p className='text-sm text-center text-muted-foreground'>This reset link is not valid. <Link href='/forgot-password' className='link'>Request a new one</Link>.</p>
          )}
          <div className='text-sm text-center'>
            <Link href='/sign-in' className='link'>Back to sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
