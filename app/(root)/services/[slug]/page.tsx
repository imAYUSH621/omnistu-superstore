import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EnquiryForm from '@/components/services/enquiry-form';
import { SERVICES, getService } from '@/lib/services-catalog';
import { contentReviewMode } from '@/lib/content-review';

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
  if (!s || !contentReviewMode) notFound();
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
      <EnquiryForm serviceSlug={s.slug} />
    </div>
  );
}
