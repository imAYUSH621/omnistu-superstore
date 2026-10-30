'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function CartBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const updateFromStorage = () => {
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const cartCookie = cookies.find((c) => c.trim().startsWith('sessionCartCount='));
        if (cartCookie) {
          const val = parseInt(cartCookie.split('=')[1], 10);
          if (!isNaN(val)) setCount(val);
        }
      }
    };

    updateFromStorage();

    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ qty: number }>;
      setCount((prev) => prev + (customEvent.detail?.qty || 1));
    };

    window.addEventListener('omnistu:cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('omnistu:cart-updated', handleCartUpdate);
    };
  }, []);

  return (
    <Link
      href='/cart'
      id='nav-cart'
      className='flex items-end gap-1 px-2 py-1 border border-transparent hover:border-white rounded-xs text-white relative transition-colors cursor-pointer group'
      aria-label={`${count} items in shopping cart`}
    >
      <div className='relative flex items-center justify-center w-9 h-7'>
        <ShoppingCart className='w-7 h-7 text-white group-hover:scale-105 transition-transform' />
        <span
          id='nav-cart-count'
          className='absolute -top-1.5 left-3.5 text-[#f08804] text-[15px] font-extrabold leading-none select-none tracking-tight'
        >
          {count > 99 ? '99+' : count}
        </span>
      </div>
      <span className='text-[14px] font-bold text-white hidden sm:inline pb-0.5 leading-none'>
        Cart
      </span>
    </Link>
  );
}
