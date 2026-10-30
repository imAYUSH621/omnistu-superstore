import Link from 'next/link';
import { ChevronDown, EllipsisVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserButton from './user-button';
import CartBadge from './cart-badge';
import ModeToggle from './mode-toggle';

const Menu = () => {
  return (
    <div className='flex justify-end gap-1.5 items-center font-["Amazon_Ember",Arial,sans-serif]'>
      <nav className='hidden md:flex items-center gap-1.5'>
        {/* 1. Language Picker (Amazon Style) */}
        <div className='hidden xl:flex items-center gap-1 px-2 py-2 border border-transparent hover:border-white rounded-xs cursor-pointer text-white text-[13px] font-bold transition-colors select-none'>
          <span className='text-sm leading-none'>🇺🇸</span>
          <span className='leading-none'>EN</span>
          <ChevronDown className='w-3 h-3 text-[#a7acb2]' />
        </div>

        {/* 2. Account & Lists */}
        <UserButton />

        {/* 3. Returns & Orders */}
        <Link
          href='/user/orders'
          className='hidden sm:flex flex-col text-left px-2 py-1 border border-transparent hover:border-white rounded-xs text-white leading-tight transition-colors'
        >
          <span className='text-[11px] text-[#cccccc] font-normal leading-none'>
            Returns
          </span>
          <span className='text-[13px] font-bold text-white leading-tight mt-0.5'>
            & Orders
          </span>
        </Link>

        {/* 4. Cart */}
        <CartBadge />
      </nav>

      {/* Mobile Right Bar */}
      <nav className='md:hidden flex items-center gap-1'>
        <CartBadge />
        <Sheet>
          <SheetTrigger className='p-1.5 align-middle rounded-xs text-white hover:border hover:border-white transition'>
            <EllipsisVertical className='w-5 h-5' />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start space-y-4 pt-8 bg-[#131921] text-white border-neutral-800'>
            <SheetTitle className='font-bold text-lg text-white'>Menu</SheetTitle>
            <div className='w-full border-b border-neutral-700 pb-3'>
              <UserButton />
            </div>
            <Link
              href='/user/orders'
              className='text-sm font-semibold hover:text-amber-400 py-1'
            >
              Returns & Orders
            </Link>
            <Link
              href='/search?sort=deals'
              className='text-sm font-semibold hover:text-amber-400 py-1'
            >
              Today&apos;s Deals
            </Link>
            <Link
              href='/admin'
              className='text-sm font-bold text-amber-400 py-1'
            >
              Seller Central / Admin
            </Link>
            <div className='flex items-center gap-3 pt-3 border-t border-neutral-700 w-full'>
              <ModeToggle />
              <span className='text-xs text-neutral-400'>Toggle Theme</span>
            </div>
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
