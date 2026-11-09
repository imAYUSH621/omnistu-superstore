'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import{useStoreLanguage}from '@/hooks/use-store-language';
import{HEADER_COPY}from '@/lib/header-language';

/** True when the current path belongs to the Services side of Omnistu. */
export const isServicesPath = (pathname: string | null) =>
  pathname === '/services' || (pathname ?? '').startsWith('/services/');

/**
 * Products | Services switch. Products is the default storefront; Services
 * opens /services. A pill slides between the two (CSS transition only, and
 * disabled under prefers-reduced-motion).
 */
export default function SiteSwitch({ className }: { className?: string }) {
  const services = isServicesPath(usePathname());
  const c=HEADER_COPY[useStoreLanguage()];
  return (
    <div
      role='navigation'
      aria-label={c.sections}
      className={cn(
        'relative inline-grid grid-cols-2 rounded-full border border-white/25 bg-white/10 p-0.5 text-[13px] font-semibold',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#f3a847] shadow-xs transition-transform duration-300 ease-out motion-reduce:transition-none',
          services && 'translate-x-full'
        )}
      />
      <Link
        href='/'
        aria-current={services ? undefined : 'page'}
        className={cn('relative z-10 px-3 py-1 text-center transition-colors', services ? 'text-white' : 'text-[#1e293b]')}
      >
        {c.products}
      </Link>
      <Link
        href='/services'
        aria-current={services ? 'page' : undefined}
        className={cn('relative z-10 px-3 py-1 text-center transition-colors', services ? 'text-[#1e293b]' : 'text-white')}
      >
        {c.services}
      </Link>
    </div>
  );
}
