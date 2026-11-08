import {redirect} from 'next/navigation';
import ProfileText from '@/components/shared/profile-text';
import {profileMetadata} from '@/lib/profile-metadata';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import ProfileForm from './profile-form';

export async function generateMetadata(){return profileMetadata();}

const Profile = async () => {
  const session = await auth();
  if(!session?.user?.id)redirect('/sign-in?callbackUrl=/user/profile');

  return (
    <SessionProvider session={session}>
      <div className='max-w-md mx-auto space-y-4'>
        <h2 className='h2-bold'><ProfileText name='heading'/></h2>
        <ProfileForm />
      </div>
    </SessionProvider>
  );
};

export default Profile;
