'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CartBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // Read count from cookies if available or listen to events
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
    <Button asChild variant='ghost' className='relative font-bold' id='nav-cart'>
      <Link href='/cart' className='flex items-center gap-1.5'>
        <div className='relative'>
          <ShoppingCart className='w-5 h-5 text-foreground' />
          {count > 0 && (
            <span
              id='nav-cart-count'
              className='absolute -top-2 -right-2 bg-amber-400 text-neutral-900 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs'
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
        <span className='text-sm font-semibold'>Cart</span>
      </Link>
    </Button>
  );
}
