import AuthText from '@/components/shared/auth-text';
import {authMetadata} from '@/lib/auth-metadata';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResetForm from './reset-form';

export async function generateMetadata(){return authMetadata('resetTitle');}

export default async function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await props.searchParams;
  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader>
          <CardTitle className='text-center'><AuthText name="resetTitle" pageTitle /></CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {token ? (
            <ResetForm token={token} />
          ) : (
            <p className='text-sm text-center text-muted-foreground'><AuthText name="invalidLink" /> <Link href='/forgot-password' className='link'><AuthText name="requestNew" /></Link></p>
          )}
          <div className='text-sm text-center'>
            <Link href='/sign-in' className='link'><AuthText name="back" /></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
