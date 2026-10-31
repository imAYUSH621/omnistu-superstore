import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, Download, BookOpen, Star } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Press & Media | ${APP_NAME}`,
  description:
    'Press inquiries, brand assets, company story, and recent milestones for Omnistu Superstore — the AI-native direct-to-consumer platform.',
};

export default function PressPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>

        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Newspaper className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Media & Press</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            Press & Media Room
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Resources for journalists, content creators, and media partners
          </p>
        </div>

        {/* Content */}
        <div className='space-y-10 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>

          {/* 1. Press Inquiries */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Newspaper className='w-4 h-4 text-amber-500' /> 1. For Press Inquiries
            </h2>
            <p className='mb-4'>
              We welcome media inquiries, interview requests, fact-checking questions, and collaboration proposals. Our press team aims to respond within <strong>2 business days</strong>.
            </p>
            <div className='grid sm:grid-cols-2 gap-4'>
              {[
                { label: 'General Press', email: 'press@omnistu.com', note: 'Interviews, quotes, story pitches' },
                { label: 'Partnership & Collab', email: 'partners@omnistu.com', note: 'Brand partnerships, co-marketing' },
                { label: 'Legal & Compliance', email: 'legal@omnistu.com', note: 'Regulatory, trademark, DMCA' },
                { label: 'Data Privacy Press', email: 'privacy@omnistu.com', note: 'GDPR/CCPA related press queries' },
              ].map((c) => (
                <div key={c.label} className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <div className='font-semibold text-gray-900 dark:text-white mb-1'>{c.label}</div>
                  <a href={`mailto:${c.email}`} className='text-amber-600 hover:underline font-mono text-xs'>
                    {c.email}
                  </a>
                  <div className='text-xs text-gray-500 mt-1'>{c.note}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Brand Assets */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Download className='w-4 h-4 text-amber-500' /> 2. Brand Assets
            </h2>
            <p className='mb-4'>
              Use the assets below for editorial coverage. Please do not alter the logo colours, distort proportions, or place the logo on clashing backgrounds without written approval.
            </p>
            <div className='grid sm:grid-cols-3 gap-4'>
              {[
                { title: 'Logo Pack (SVG + PNG)', size: 'ZIP · 4.2 MB', desc: 'Full colour, dark, light, monochrome variants' },
                { title: 'Brand Guidelines PDF', size: 'PDF · 1.8 MB', desc: 'Typography, colour palette, spacing rules' },
                { title: 'Product Screenshot Pack', size: 'ZIP · 18 MB', desc: 'Hi-res storefront and app screenshots' },
              ].map((a) => (
                <div
                  key={a.title}
                  className='border border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-4 flex flex-col gap-2'
                >
                  <Download className='w-5 h-5 text-amber-500' />
                  <div className='font-semibold text-gray-900 dark:text-white text-xs'>{a.title}</div>
                  <div className='text-xs text-gray-500'>{a.desc}</div>
                  <span className='text-xs text-gray-400 font-mono'>{a.size}</span>
                  <a
                    href='mailto:press@omnistu.com?subject=Brand Asset Request'
                    className='text-xs text-amber-600 hover:underline mt-1'
                  >
                    Request via email →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Our Story */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <BookOpen className='w-4 h-4 text-amber-500' /> 3. Our Story
            </h2>
            <p className='mb-3'>
              {APP_NAME} was born from a straightforward observation: the two largest costs embedded in every online order — platform commission and warehouse handling — deliver zero value to the end customer. They exist solely to sustain the infrastructure of marketplace incumbents.
            </p>
            <p className='mb-3'>
              We built {APP_NAME} to answer the question: <em>what does a shopping platform look like when you build it from first principles in 2026, assuming AI handles sourcing, routing, and support?</em> The answer turned out to be leaner, faster, and dramatically cheaper than anything that came before.
            </p>
            <p>
              Today, {APP_NAME} operates across seven currency zones, partners with more than 1,200 verified global suppliers, and fulfills orders into 80+ countries — all without a single traditional warehouse or human buyer on the payroll. Our Omnistu Botanics clean beauty line and AI Apparel Lab print division extend that same philosophy into private-label territory.
            </p>
          </section>

          {/* 4. Recent Milestones */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Star className='w-4 h-4 text-amber-500' /> 4. Recent Milestones
            </h2>
            <div className='space-y-3'>
              {[
                { date: 'Oct 2026', event: 'Platform launch — live across USD, INR, GBP, EUR, AED, CAD, AUD currency zones.' },
                { date: 'Oct 2026', event: 'Omnistu Botanics LLC white-label clean beauty line goes live via Blanka partnership.' },
                { date: 'Oct 2026', event: 'AI Apparel Lab (print-on-demand via Printify) opens for consumer orders.' },
                { date: 'Oct 2026', event: 'CJ Dropshipping verified supplier integration — 1,200+ active SKUs.' },
                { date: 'Q4 2026', event: 'BrandsGateway premium fashion catalog integration (target: 80,000+ designer SKUs).' },
                { date: 'Q1 2027', event: 'Trendsi and Faire marketplace integrations planned for independent boutique access.' },
                { date: 'Q1 2027', event: 'Blind-ship recyclable packaging commitment across all CJ Dropshipping orders.' },
              ].map((m, i) => (
                <div key={i} className='flex gap-4 items-start'>
                  <span className='text-amber-600 font-mono text-xs whitespace-nowrap pt-0.5 min-w-[72px]'>{m.date}</span>
                  <span className='text-gray-700 dark:text-gray-300 text-xs'>{m.event}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Callout */}
          <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200'>
            <strong>Media kit & embargo requests:</strong> Email{' '}
            <span className='font-mono underline'>press@omnistu.com</span> with your outlet name, publication date, and scope of coverage. We respond within 2 business days.
          </div>
        </div>

        {/* Footer nav */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs'>
          <Link href='/' className='text-amber-600 hover:underline font-bold'>← Return to Store</Link>
          <div className='flex gap-4 text-gray-500'>
            <Link href='/terms' className='hover:underline'>Terms</Link>
            <Link href='/privacy' className='hover:underline'>Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
