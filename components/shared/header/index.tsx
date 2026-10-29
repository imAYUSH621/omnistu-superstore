import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import Menu from './menu';
import CategoryDrawer from './category-drawer';
import Search from './search';

const Header = () => {
  return (
    <header className='w-full border-b border-neutral-200 dark:border-neutral-800 bg-background/95 backdrop-blur-md sticky top-0 z-40'>
      <div className='wrapper flex items-center justify-between gap-4 py-2.5'>
        {/* Brand & Drawer */}
        <div className='flex items-center gap-2'>
          <CategoryDrawer />
          <Link href='/' className='flex items-center gap-2'>
            <Image
              src='/images/logo.svg'
              alt={`${APP_NAME} logo`}
              height={36}
              width={36}
              priority={true}
            />
            <span className='hidden sm:block font-extrabold text-xl tracking-tight text-foreground'>
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className='hidden md:flex flex-1 justify-center max-w-xl mx-4'>
          <Search />
        </div>

        {/* Right Menu & Cart */}
        <Menu />
      </div>

      {/* Mobile Search Bar Row */}
      <div className='md:hidden px-4 pb-2.5'>
        <Search />
      </div>
    </header>
  );
};

export default Header;
