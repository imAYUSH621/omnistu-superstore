import Link from 'next/link';
import Menu from './menu';
import CategoryDrawer from './category-drawer';
import Search from './search';
import T from '@/components/shared/i18n-text';
import SiteSwitch from './site-switch';

const Header = () => {
  return (
    <header className='w-full bg-[#1e293b] text-white relative z-40 select-none font-sans'>
      {/* 1. Main Navbar Belt (#1e293b) */}
      <div className='max-w-[1520px] mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 py-1.5 min-h-[60px]'>
        {/* Left: Brand Logo + Deliver To Widget */}
        <div className='flex items-center gap-1 sm:gap-3 shrink-0'>
          {/* Authentic Omnistu Smile Logo */}
          <Link
            href='/'
            className='flex items-center px-2 py-1.5 border border-transparent hover:border-white rounded-xs transition-colors'
            aria-label='Omnistu Superstore Home'
          >
            {/* Brand mark: user-supplied wide logo (pack v2), static at
                40-44px. No animation: the shine sweep hurt small-size
                readability, removed on owner feedback. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/images/logo/omnistu-logo-wide-400.png'
              alt='Omnistu Superstore'
              className='h-10 sm:h-11 w-auto'
              width={400}
              height={137}
              data-testid='site-logo'
            />
          </Link>

        </div>

        <SiteSwitch className='hidden 2xl:inline-grid shrink-0' />

        {/* Center: 3-Piece Rectangular Amazon Search Bar */}
        <div className='hidden 2xl:flex flex-1 min-w-0 justify-center max-w-3xl mx-2'>
          <Search />
        </div>

        {/* Right Menu (Language, Account & Lists, Orders, Cart) */}
        <div className='flex items-center shrink-0'>
          <Menu />
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className='2xl:hidden px-3 pb-2 pt-1 bg-[#1e293b] space-y-2 xl:space-y-0 xl:flex xl:items-center xl:justify-center xl:gap-4'>
        <SiteSwitch className='grid w-full xl:w-[290px] xl:shrink-0' />
        <Search />
      </div>

      {/* 2. Amazon-Style Subnav Belt (#334155) */}
      <div className='bg-[#334155] text-white text-[13px] font-medium border-t border-[#475569]/50 shadow-inner'>
        <div className='max-w-[1520px] mx-auto px-3 sm:px-4 flex items-center justify-between py-1 gap-2'>
          {/* Authentic Subnav Quick Links (Matching Image 2) */}
          <div className='flex items-center gap-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <div className='flex items-center gap-1 px-2 py-1.5 border border-transparent hover:border-white rounded-xs cursor-pointer font-bold transition-colors'>
              <CategoryDrawer />
            </div>
            <Link
              href='/search?category=Tech%20%26%20Gadgets'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              <T k='techGadgets' />
            </Link>
            <Link
              href='/search?category=Jewelry%20%26%20Watches'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              <T k='jewelryWatches' />
            </Link>
            <Link
              href='/search?category=Custom%20Apparel'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              <T k='customApparel' />
            </Link>
            <Link
              href='/contact'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              <T k='customerService' />
            </Link>
            <Link
              href='/orders'
              className='px-2 py-1.5 border border-transparent hover:border-white rounded-xs whitespace-nowrap transition-colors'
            >
              <T k='trackOrder' />
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
