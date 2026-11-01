import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SERVICES, getService } from '@/lib/services-catalog';

export const dynamicParams = false;
export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getService((await params).slug);
  return { title: s ? s.title : 'Services' };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = getService((await params).slug);
  if (!s) notFound();
  return (
    <div className='max-w-[800px] mx-auto px-4 py-10 space-y-5'>
      <Link href='/services' className='text-sm underline'>
        All services
      </Link>
      <h1 className='text-3xl font-bold'>{s.title}</h1>
      <p>{s.summary}</p>
      <div>
        <h2 className='font-semibold mb-2'>What this covers</h2>
        <ul className='list-disc pl-5 space-y-1 text-sm'>
          {s.covers.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <Link
        href='/contact'
        className='inline-block rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white'
      >
        Enquire about this
      </Link>
    </div>
  );
}
