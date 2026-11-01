'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const links = [
  {
    title: 'Overview',
    href: '/admin/overview',
  },
  {
    title: 'Products',
    href: '/admin/products',
  },
  {
    title: 'Orders',
    href: '/admin/orders',
  },
  {
    title: 'Users',
    href: '/admin/users',
  },
  {
    title: 'Returns',
    href: '/admin/returns',
  },
  {
    title: 'Service enquiries',
    href: '/admin/enquiries',
  },
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6 whitespace-nowrap', className)}
      {...props}
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'shrink-0 text-sm font-medium transition-colors hover:text-white',
            pathname.includes(item.href)
              ? 'text-white border-b-2 border-amber-400 pb-0.5'
              : 'text-neutral-300'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
