import Image from 'next/image';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import Menu from './menu';
import CategoryDrawer from './category-drawer';
import Search from './search';
import { ShieldCheck, Truck } from 'lucide-react';

const Header = () => {
  return (
    <header className='w-full border-b border-neutral-800 bg-[#131921] text-white sticky top-0 z-40 shadow-sm'>
      {/* 1. Main Navbar */}
      <div className='wrapper flex items-center justify-between gap-3 py-2'>
        {/* Brand & Left Navigation */}
        <div className='flex items-center gap-3'>
          <Link href='/' className='flex items-center gap-2 hover:opacity-90 transition'>
            <Image
              src='/images/logo.svg'
              alt={`${APP_NAME} logo`}
              height={34}
              width={34}
              priority={true}
              className='brightness-125'
            />
            <span className='hidden sm:block font-extrabold text-xl tracking-tight text-white'>
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Center Search Bar with Department Selector */}
        <div className='hidden md:flex flex-1 justify-center max-w-2xl mx-4'>
          <Search />
        </div>

        {/* Right Menu (Cart, User, Mode) */}
        <div className='flex items-center gap-2 text-white'>
          <Menu />
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className='md:hidden px-4 pb-2'>
        <Search />
      </div>

      {/* 2. Amazon-Style Subnav Strip */}
      <div className='bg-[#232f3e] border-t border-[#37475a] text-white text-[13px] font-medium'>
        <div className='wrapper flex items-center justify-between overflow-x-auto py-1.5 scrollbar-none gap-4'>
          {/* Left Category Quick Links */}
          <div className='flex items-center gap-4 shrink-0'>
            <div className='flex items-center gap-1.5 hover:text-amber-400 cursor-pointer py-1 px-1.5 rounded'>
              <CategoryDrawer />
              <span className='font-bold'>All Departments</span>
            </div>
            <Link
              href='/search?sort=deals'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded'
            >
              Today&apos;s Deals
            </Link>
            <Link
              href='/search?sort=bestsellers'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded'
            >
              Best Sellers
            </Link>
            <Link
              href='/search?category=Electronics %26 Gadgets'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded'
            >
              Electronics & Tech
            </Link>
            <Link
              href='/search?category=Apparel %26 Merch'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded'
            >
              Fashion & Streetwear
            </Link>
            <Link
              href='/search?category=Toys %26 Games'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded'
            >
              Sensory & Fidget Toys
            </Link>
            <Link
              href='/search?category=Home %26 Kitchen'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded'
            >
              Home & Workspace
            </Link>
            <Link
              href='/admin'
              className='hover:text-amber-400 whitespace-nowrap py-1 px-1.5 rounded font-bold text-amber-400'
            >
              Seller Hub / Admin
            </Link>
          </div>

          {/* Right Direct Assurance */}
          <div className='hidden lg:flex items-center gap-4 text-xs text-neutral-300 shrink-0 font-normal'>
            <span className='flex items-center gap-1.5'>
              <Truck className='w-3.5 h-3.5 text-amber-400' /> Free Express 2-Day Delivery
            </span>
            <span className='flex items-center gap-1.5'>
              <ShieldCheck className='w-3.5 h-3.5 text-emerald-400' /> 30-Day Money-Back Guarantee
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
