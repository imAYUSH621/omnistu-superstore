import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BLOG_ARTICLES, getArticle } from '@/lib/blog-catalog';

export const dynamicParams = false;
export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  return a ? { title: a.title, description: a.summary } : { title: 'Blog' };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  return (
    <div className='max-w-[760px] mx-auto px-4 py-10 space-y-5'>
      <Link href='/blog' className='text-sm underline'>
        All articles
      </Link>
      <h1 className='text-3xl font-bold'>{a.title}</h1>
      <p className='text-xs text-muted-foreground'>{a.date} - Omnistu editorial</p>
      {a.body.map((block, i) =>
        block.kind === 'h2' ? (
          <h2 key={i} className='text-xl font-semibold pt-3'>
            {block.text}
          </h2>
        ) : (
          <p key={i} className='text-[15px] leading-relaxed'>
            {block.text}
          </p>
        )
      )}
      <p className='text-sm text-muted-foreground pt-4 border-t'>
        Questions about a project or an order?{' '}
        <Link href='/contact' className='underline font-medium'>
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
