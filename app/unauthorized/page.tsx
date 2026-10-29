import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Verification Required | Omnistu Superstore',
};

export default function UnauthorizedPage() {
  return (
    <div className='container mx-auto flex min-h-[70vh] flex-col items-center justify-center space-y-5 px-4 text-center'>
      <div className='w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 mb-2'>
        <ShieldAlert className='w-8 h-8' />
      </div>
      <h1 className='text-2xl md:text-3xl font-extrabold text-[#0f1111] dark:text-white'>
        Admin Authentication Required
      </h1>
      <p className='text-sm text-neutral-600 dark:text-neutral-400 max-w-md leading-relaxed'>
        The Seller Executive Center is protected. Please sign in with your administrative credentials to manage orders, suppliers, and margins.
      </p>

      <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
        <Link href='/sign-in?callbackUrl=/admin'>
          <Button className='bg-[#FFD814] hover:bg-[#F7CA00] text-neutral-900 font-bold px-6 h-11 rounded-full shadow-sm'>
            Sign In to Admin Hub
          </Button>
        </Link>
        <Link href='/'>
          <Button
            variant='outline'
            className='border-neutral-300 dark:border-neutral-700 font-semibold px-6 h-11 rounded-full'
          >
            Return to Storefront
          </Button>
        </Link>
      </div>

      <div className='text-xs text-neutral-500 pt-4 border-t max-w-sm'>
        Pre-configured admin login: <code>admin@example.com</code> / <code>123456</code> or <code>admin@omnistu.com</code> / <code>2026</code>
      </div>
    </div>
  );
}
