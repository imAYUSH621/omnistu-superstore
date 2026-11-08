import AuthText from '@/components/shared/auth-text';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {authMetadata} from '@/lib/auth-metadata';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import CredentialsSignInForm from './credentials-signin-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function generateMetadata(){return authMetadata('signIn');}

const SignInPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const { callbackUrl } = await props.searchParams;

  const session = await auth();

  if (session) {
    return redirect(callbackUrl || '/');
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader className='space-y-4'>
          <Link href='/' className='flex-center'>
            <Image
              src='/images/logo.svg'
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </Link>
          <CardTitle className='text-center'><AuthText name="signIn" pageTitle /></CardTitle>
          <CardDescription className='text-center'>
            <AuthText name="signInIntro" />
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;
