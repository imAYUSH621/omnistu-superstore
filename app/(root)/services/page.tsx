import Link from 'next/link';
import type { Metadata } from 'next';
import { SERVICES } from '@/lib/services-catalog';

export const metadata: Metadata = { title: 'Services' };

export default function ServicesPage() {
  return (
    <div className='max-w-[1100px] mx-auto px-4 py-10 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>Omnistu Services</h1>
        <p className='text-sm text-muted-foreground max-w-2xl'>
          Services are the second half of Omnistu, alongside Products. Browse what we do, then
          tell us what you need.
        </p>
      </div>
      <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {SERVICES.map((s) => (
          <li key={s.slug} className='rounded-md border bg-card p-4 flex flex-col'>
            <h2 className='font-semibold'>
              <Link href={`/services/${s.slug}`} className='hover:underline'>
                {s.title}
              </Link>
            </h2>
            <p className='text-sm text-muted-foreground mt-1 grow'>{s.summary}</p>
            <Link href={`/services/${s.slug}`} className='text-sm font-medium text-[#4f46e5] mt-3'>
              Learn more
            </Link>
          </li>
        ))}
      </ul>
      <p className='text-sm'>
        Portfolio and case studies are on{' '}
        <a href='https://omnistu.com' className='underline font-medium' rel='noopener'>
          omnistu.com
        </a>
        . Questions or a project in mind? <Link href='/contact' className='underline font-medium'>Contact us</Link>.
      </p>
    </div>
  );
}
