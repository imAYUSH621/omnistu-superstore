'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

const links = [
  {
    title: 'Overview',
    href: '/user',
  },
  {
    title: 'Profile',
    href: '/user/profile',
  },
  {
    title: 'Orders',
    href: '/user/orders',
  },
  {
    title: 'Enquiries',
    href: '/user/enquiries',
  },
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  // On narrow screens the tab row scrolls; keep the current tab visible.
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [pathname]);
  return (
    <nav
      className={cn(
        'flex items-center space-x-4 lg:space-x-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      {...props}
    >
      {links.map((item) => {
        const active =
          item.href === '/user'
            ? pathname === '/user'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            ref={active ? activeRef : undefined}
            href={item.href}
            className={cn(
              'shrink-0 whitespace-nowrap text-sm font-medium transition-colors hover:text-white',
              active ? 'text-white' : 'text-neutral-400'
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNav;
