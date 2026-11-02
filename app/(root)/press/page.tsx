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
    <div className='w-full min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] py-8 px-4 sm:px-6 font-sans'>
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
              We welcome media inquiries, interview requests, fact-checking questions, and collaboration proposals. Reach us through the contact form at /contact.
            </p>
            <div className='grid sm:grid-cols-2 gap-4'>
              {[
                { label: 'Contact', email: null, note: 'Use the contact form at /contact for press, partnerships, legal and privacy inquiries.' },
              ].map((c) => (
                <div key={c.label} className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <div className='font-semibold text-gray-900 dark:text-white mb-1'>{c.label}</div>
                  <a href='/contact' className='text-amber-600 hover:underline font-mono text-xs'>
                    /contact
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
                    href='/contact'
                    className='text-xs text-amber-600 hover:underline mt-1'
                  >
                    Request via contact form →
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
              Today, {APP_NAME} is a demo storefront in active development. Supplier, fulfillment, and private-label integrations are planned or in sandbox testing - no live supplier partnerships, fulfillment network, or country footprint exists yet. This page will be updated with verified milestones only after launch.
            </p>
          </section>

          {/* 4. Status &amp; Roadmap */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Star className='w-4 h-4 text-amber-500' /> 4. Status &amp; Roadmap
            </h2>
            <div className='space-y-3'>
              {[
                { date: 'Nov 2026', event: 'Demo storefront in test mode - sample catalog, simulated orders, no live suppliers or fulfillment.' },
                { date: 'Planned', event: 'Supplier integrations (CJ Dropshipping, BrandsGateway, Trendsi) - adapters in development, not connected.' },
                { date: 'Planned', event: 'Print-on-demand via Printify - planned, not connected.' },
                { date: 'Planned', event: 'Private-label lines (Botanics clean beauty, AI Apparel Lab) - concepts only, not live.' },
                { date: 'Planned', event: 'Launch across USD, INR, GBP, EUR, AED, CAD, AUD currency zones - pending hosting and provider keys.' },
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
            <strong>Media kit & embargo requests:</strong> Use the contact form at /contact with your outlet name, publication date, and scope of coverage.
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
