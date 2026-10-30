import Link from 'next/link';
import Menu from './menu';
import CategoryDrawer from './category-drawer';
import Search from './search';
import { MapPin, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className='w-full bg-[#131921] text-white relative z-40 select-none font-["Amazon_Ember",Arial,sans-serif]'>
      {/* 1. Main Navbar Belt (#131921) */}
      <div className='max-w-[1520px] mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 py-1.5 min-h-[60px]'>
        {/* Left: Brand Logo + Deliver To Widget */}
        <div className='flex items-center gap-1 sm:gap-3 shrink-0'>
          {/* Authentic Omnistu Smile Logo */}
          <Link
            href='/'
            className='flex items-center px-2 py-1.5 border border-transparent hover:border-white rounded-xs transition-colors'
            aria-label='Omnistu Superstore Home'
          >
            <div className='flex flex-col items-start leading-none relative'>
              <div className='flex items-baseline'>
                <span className='font-bold text-[22px] tracking-tight text-white'>
                  omnistu
                </span>
                <span className='font-bold text-[12px] text-[#febd69] ml-0.5'>
                  .us
                </span>
              </div>
              {/* Authentic Amazon curved orange smile arrow SVG */}
              <svg
                className='w-16 h-2.5 -mt-0.5 ml-1'
                viewBox='0 0 60 10'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M2 3 Q30 11 54 2.5'
                  stroke='#ff9900'
                  strokeWidth='2'
                  strokeLinecap='round'
                  fill='none'
                />
                <path d='M50 0.5 L57 2.5 L51 5 Z' fill='#ff9900' />
              </svg>
            </div>
          </Link>

          {/* Amazon Deliver to India Location Widget */}
          <div className='hidden lg:flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer text-white transition-colors'>
            <MapPin className='w-4 h-4 text-white shrink-0 mt-1' />
            <div className='flex flex-col text-left leading-tight'>
              <span className='text-[11px] text-[#cccccc] font-normal leading-none'>
                Deliver to
              </span>
              <span className='text-[13px] font-bold text-white leading-tight mt-0.5'>
                India
              </span>
            </div>
          </div>
        </div>

        {/* Center: 3-Piece Rectangular Amazon Search Bar */}
        <div className='hidden md:flex flex-1 justify-center max-w-3xl mx-2'>
          <Search />
        </div>

        {/* Right Menu (Language, Account & Lists, Orders, Cart) */}
        <div className='flex items-center shrink-0'>
          <Menu />
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className='md:hidden px-3 pb-2 pt-1 bg-[#131921]'>
        <Search />
      </div>

      {/* 2. Amazon-Style Subnav Belt (#232f3e) */}
      <div className='bg-[#232f3e] text-white text-[13px] font-medium border-t border-[#37475a]/50 shadow-inner'>
        <div className='max-w-[1520px] mx-auto px-3 sm:px-4 flex items-center justify-between overflow-x-auto py-1 scrollbar-none gap-2'>
          {/* Authentic Subnav Quick Links (Matching Image 2) */}
          <div className='flex items-center gap-1 shrink-0'>
            <div className='flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer font-bold transition-colors'>
              <CategoryDrawer />
              <span className='text-[14px] leading-none'>All</span>
            </div>
            <Link
              href='/s?k=prime+video'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Prime Video
            </Link>
            <Link
              href='/search?sort=deals'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Coupons
            </Link>
            <Link
              href='/search'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Customer Service
            </Link>
            <Link
              href='/search?sort=deals'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Today&apos;s Deals
            </Link>
            <Link
              href='/search?sort=bestsellers'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Registry
            </Link>
            <Link
              href='/s?k=gift+cards'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Gift Cards
            </Link>
            <Link
              href='/admin'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              Sell
            </Link>
          </div>

          {/* Right Direct Seller Central / Admin Trigger */}
          <div className='flex items-center gap-2 shrink-0'>
            <Link
              href='/admin'
              className='flex items-center gap-1.5 bg-[#febd69] hover:bg-[#f3a847] text-[#131921] px-2.5 py-1 rounded-xs text-[12px] font-bold transition-colors shadow-xs'
            >
              <Sparkles className='w-3.5 h-3.5 text-[#131921]' />
              <span>Seller Central / Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
