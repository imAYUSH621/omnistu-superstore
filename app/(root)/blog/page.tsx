import Link from 'next/link';
import type { Metadata } from 'next';
import { BLOG_ARTICLES } from '@/lib/blog-catalog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical articles from Omnistu on selling online, websites and fulfilment.',
};

export default function BlogPage() {
  return (
    <div className='max-w-[900px] mx-auto px-4 py-10 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>Omnistu Blog</h1>
        <p className='text-sm text-muted-foreground max-w-2xl'>
          Practical articles on selling online, websites and fulfilment - from the Omnistu team.
        </p>
      </div>
      <ul className='space-y-5'>
        {BLOG_ARTICLES.map((a) => (
          <li key={a.slug} className='rounded-md border bg-card p-4'>
            <h2 className='font-semibold text-lg'>
              <Link href={`/blog/${a.slug}`} className='hover:underline'>
                {a.title}
              </Link>
            </h2>
            <p className='text-xs text-muted-foreground mt-1'>{a.date}</p>
            <p className='text-sm text-muted-foreground mt-2'>{a.summary}</p>
            <Link href={`/blog/${a.slug}`} className='text-sm font-medium text-[#4f46e5] mt-3 inline-block'>
              Read article
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
