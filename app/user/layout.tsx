import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import MainNav from './main-nav';

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className='flex flex-col'>
        <div className='border-b border-neutral-800 bg-[#0f172a]'>
          <div className='flex items-center h-16 px-4 container mx-auto'>
            <Link href='/' className='w-10 sm:w-22 shrink-0'>
              <Image
                src='/images/logo.svg'
                height={40}
                width={40}
                alt={APP_NAME}
              />
            </Link>
            <MainNav className='mx-3 sm:mx-6 min-w-0 overflow-x-auto' />
            <div className='ml-auto shrink-0 items-center flex space-x-4'>
              <Menu />
            </div>
          </div>
        </div>

        <div className='flex-1 space-y-4 p-8 pt-6 container mx-auto'>
          {children}
        </div>
      </div>
    </>
  );
}
