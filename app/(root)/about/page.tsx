import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Globe, ShieldCheck, Cpu } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `About Us | ${APP_NAME}`,
  description:
    'Learn how Omnistu Superstore is cutting out the Amazon middleman with AI-native sourcing, direct-to-consumer pricing, and a 30-day satisfaction guarantee.',
};

export default function AboutPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>

        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Globe className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Company</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            About {APP_NAME}
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Building the world&apos;s most transparent AI-native shopping experience
          </p>
        </div>

        {/* Content */}
        <div className='space-y-10 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>

          {/* 1. Our Mission */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Zap className='w-4 h-4 text-amber-500' /> 1. Our Mission
            </h2>
            <p className='mb-3'>
              {APP_NAME} was founded on a single, radical premise: every customer deserves factory-direct pricing — with none of the 10–15% platform tax that marketplace giants silently collect on every order.
            </p>
            <p className='mb-3'>
              Traditional e-commerce platforms act as toll roads between makers and buyers. We ripped out that toll road. Our AI-native sourcing engine connects you directly to verified global suppliers, so the savings land in your pocket — not in a shareholder&apos;s quarterly report.
            </p>
            <div className='grid sm:grid-cols-3 gap-4 mt-4'>
              {[
                { label: 'Platform Tax Eliminated', value: '0%', sub: 'vs. 15% industry avg.' },
                { label: 'Verified Global Suppliers', value: '1,200+', sub: 'across 38 countries' },
                { label: 'Avg. Customer Savings', value: '22%', sub: 'vs. marketplace prices' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-center'
                >
                  <div className='text-2xl font-extrabold text-amber-600'>{stat.value}</div>
                  <div className='font-semibold text-gray-800 dark:text-gray-200 text-xs mt-1'>{stat.label}</div>
                  <div className='text-gray-500 text-xs'>{stat.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. How We Work */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Cpu className='w-4 h-4 text-amber-500' /> 2. How We Work
            </h2>
            <p className='mb-3'>
              Our sourcing engine is entirely AI-native — meaning no human buyer, no seasonal catalog, and no markups baked in for &ldquo;curation.&rdquo; Here&apos;s the supply chain in plain English:
            </p>
            <ol className='list-decimal pl-5 space-y-3'>
              <li>
                <strong>AI Discovery:</strong> Our models scan CJ Dropshipping, Printify, BrandsGateway, Blanka, and dozens of regional catalogs 24/7 — surfacing trending items before they hit mainstream markets.
              </li>
              <li>
                <strong>Brand Sanitization:</strong> Our AI Brand Sanitizer strips supplier branding from listings and replaces it with a clean, neutral product identity — giving you premium aesthetics at wholesale prices.
              </li>
              <li>
                <strong>Zero-Inventory Fulfillment:</strong> Orders are dispatched directly from supplier warehouses or print-on-demand studios. We never hold physical stock, which means no overstock markups are ever passed to you.
              </li>
              <li>
                <strong>Edge Routing:</strong> Cloudflare edge infrastructure routes your order to the fastest available fulfillment node — typically dispatching within 24–48 hours of payment confirmation.
              </li>
            </ol>
          </section>

          {/* 3. Our Promise */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <ShieldCheck className='w-4 h-4 text-amber-500' /> 3. Our Promise
            </h2>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <strong>30-Day Satisfaction Guarantee:</strong> If you&apos;re not happy for any reason — wrong size, quality mismatch, or simply changed your mind — we&apos;ll arrange a hassle-free return or full replacement within 30 days of delivery.
              </li>
              <li>
                <strong>Blind Shipping:</strong> All orders ship in plain, unbranded packaging. No supplier names, no factory labels, no third-party marketing collateral inside your parcel.
              </li>
              <li>
                <strong>No Middlemen in Your Data:</strong> We do not sell, rent, or trade your personal information to ad brokers, data aggregators, or marketing platforms. Your order data is used exclusively for fulfillment and fraud prevention.
              </li>
              <li>
                <strong>Transparent Pricing:</strong> The price you see is the price you pay — including all platform costs. No hidden &ldquo;convenience fees&rdquo; added at checkout.
              </li>
            </ul>
          </section>

          {/* 4. The Technology */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Zap className='w-4 h-4 text-amber-500' /> 4. The Technology
            </h2>
            <p className='mb-3'>
              {APP_NAME} runs on a zero-cost edge infrastructure stack — meaning our operating costs are a fraction of traditional e-commerce platforms, and those savings flow directly into lower prices for you.
            </p>
            <div className='grid sm:grid-cols-2 gap-4'>
              {[
                {
                  title: 'AI Brand Sanitizer',
                  desc: 'Automatically strips wholesale supplier branding and generates clean, neutral product listings at scale.',
                },
                {
                  title: 'Live Currency Engine',
                  desc: 'Real-time exchange rate API delivers accurate local pricing in USD, INR, GBP, EUR, AED, CAD, and AUD.',
                },
                {
                  title: 'Edge Fulfillment Router',
                  desc: 'Cloudflare edge nodes select the optimal dispatch point from 1,200+ global supplier nodes within milliseconds.',
                },
                {
                  title: 'AI Concierge',
                  desc: '24/7 autonomous support agent handles order tracking, returns, and product queries without human intervention.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                >
                  <div className='font-bold text-gray-900 dark:text-white mb-1'>{item.title}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact callout */}
          <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200'>
            <strong>Questions about our business?</strong> Reach our team at{' '}
            <span className='font-mono underline'>hello@omnistu.com</span> or connect via our 24/7 AI Concierge.
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
