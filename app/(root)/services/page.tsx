import Link from 'next/link';
import type { Metadata } from 'next';
import { SERVICES } from '@/lib/services-catalog';

export const metadata: Metadata = {
  title: 'Services',
  // Holding state until the real service list is approved: keep out of search indexes.
  robots: SERVICES.length ? undefined : { index: false, follow: true },
};

export default function ServicesPage() {
  return (
    <div className='max-w-[1100px] mx-auto px-4 py-10 space-y-6'>
      <h1 className='text-3xl font-bold'>Omnistu Services</h1>
      {SERVICES.length === 0 ? (
        <div className='rounded-md border bg-muted/40 p-5 space-y-3'>
          <p className='text-sm'>
            Services are the second half of Omnistu, alongside Products.
            The service list is being finalised and is not published yet.
          </p>
          <p className='text-sm'>
            To ask about a service now, <Link href='/contact' className='underline font-medium'>contact us</Link>.
            Or go back to <Link href='/' className='underline font-medium'>Products</Link>.
          </p>
        </div>
      ) : (
        <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {SERVICES.map((s) => (
            <li key={s.slug} className='rounded-md border p-4'>
              <h2 className='font-semibold'>{s.title}</h2>
              <p className='text-sm text-muted-foreground mt-1'>{s.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
