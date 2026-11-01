import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import Menu from '@/components/shared/header/menu';
import MainNav from './main-nav';
import AdminSearch from '@/components/admin/admin-search';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className='flex flex-col'>
        {/* Dark header: the shared storefront Menu hard-codes text-white for
            the dark storefront header, so a light admin header made every
            account/cart control white-on-white. */}
        <div className='border-b border-neutral-700 bg-[#1e293b] text-white'>
          {/* Below md the header wraps to two rows: logo + search + account on top, the section
              links underneath in a horizontally scrollable strip (nothing is hidden). */}
          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 container mx-auto md:h-16 md:flex-nowrap md:py-0'>
            <Link href='/' className='w-22 shrink-0'>
              <Image
                src='/images/logo.svg'
                height={48}
                width={48}
                alt={APP_NAME}
              />
            </Link>
            <MainNav className='order-last w-full overflow-x-auto pb-1 md:order-none md:mx-6 md:w-auto md:overflow-visible md:pb-0' />
            <div className='ml-auto flex min-w-0 items-center gap-2 md:space-x-4'>
              <AdminSearch />
              <Menu />
            </div>
          </div>
        </div>

        <div className='flex-1 space-y-4 p-4 pt-6 md:p-8 md:pt-6 container mx-auto'>
          {children}
        </div>
      </div>
    </>
  );
}
