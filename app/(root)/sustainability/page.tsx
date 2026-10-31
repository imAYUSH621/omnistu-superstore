import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Leaf, Package, Droplets, Truck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Sustainability | ${APP_NAME}`,
  description:
    "How Omnistu Superstore's direct-to-maker sourcing, on-demand print model, and minimal packaging standards reduce waste across every order.",
};

export default function SustainabilityPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>

        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Leaf className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Responsibility</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            Sustainability at {APP_NAME}
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-2'>
            Direct-to-Maker Sourcing — Less waste, more value, every order
          </p>
        </div>

        {/* Content */}
        <div className='space-y-10 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>

          {/* 1. Why Direct Sourcing Matters */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Leaf className='w-4 h-4 text-amber-500' /> 1. Why Direct Sourcing Matters
            </h2>
            <p className='mb-3'>
              The traditional retail supply chain is a chain of redundancies: factory → national distributor → regional warehouse → platform fulfillment center → last-mile carrier. Every link adds carbon, packaging, and handling cost.
            </p>
            <p className='mb-3'>
              {APP_NAME} collapses this chain to two hops: <strong>maker → customer</strong>. Eliminating warehouse duplication alone reduces carbon-equivalent emissions per parcel by an estimated 30–40% compared to the multi-warehouse model operated by large marketplace platforms.
            </p>
            <div className='grid sm:grid-cols-3 gap-4 mt-4'>
              {[
                { label: 'Fewer Warehouse Touches', value: '−2', sub: 'vs. traditional 4-stop chain' },
                { label: 'Zero Overstock Waste', value: '100%', sub: 'on-demand print products' },
                { label: 'Plastic-Free Commitment', value: '2027', sub: 'all shipments target' },
              ].map((s) => (
                <div
                  key={s.label}
                  className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-center'
                >
                  <div className='text-2xl font-extrabold text-amber-600'>{s.value}</div>
                  <div className='font-semibold text-gray-800 dark:text-gray-200 text-xs mt-1'>{s.label}</div>
                  <div className='text-gray-500 text-xs'>{s.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Fulfillment Network */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Truck className='w-4 h-4 text-amber-500' /> 2. Our Fulfillment Network
            </h2>
            <p className='mb-4'>
              Our two-pillar fulfillment network is purpose-built to minimise environmental impact:
            </p>
            <div className='grid sm:grid-cols-2 gap-6'>
              <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-5'>
                <div className='font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                  <span className='bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs px-2 py-0.5 rounded font-mono'>PILLAR 1</span>
                  On-Demand Print — Printify
                </div>
                <ul className='list-disc pl-4 space-y-1.5 text-xs'>
                  <li>Items are printed <strong>only after an order is placed</strong> — zero pre-production waste.</li>
                  <li>Printify&apos;s global print-partner network dispatches from the studio nearest to your delivery address, minimising last-mile distance.</li>
                  <li>Water-based, OEKO-TEX certified inks on all apparel and home goods.</li>
                  <li>No deadstock, no landfill — unsold designs simply stop being offered, not destroyed.</li>
                </ul>
              </div>
              <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-5'>
                <div className='font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                  <span className='bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs px-2 py-0.5 rounded font-mono'>PILLAR 2</span>
                  Dropship Direct — CJ Dropshipping
                </div>
                <ul className='list-disc pl-4 space-y-1.5 text-xs'>
                  <li>CJ&apos;s 2,000+ global warehouse nodes ship items in single-parcel consolidations — no multi-box splits.</li>
                  <li>Supplier contracts require recyclable or biodegradable inner-packaging for all Omnistu-branded shipments by Q1 2027.</li>
                  <li>Automated routing selects the warehouse with lowest distance to customer, reducing per-order fuel burn.</li>
                  <li>Blind shipping eliminates secondary branded packaging layers.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Omnistu Botanics */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Droplets className='w-4 h-4 text-amber-500' /> 3. White-Label Botanics — Omnistu Botanics LLC
            </h2>
            <p className='mb-3'>
              The Omnistu Botanics line is our clean beauty and wellness vertical, operated under Omnistu Botanics LLC and sourced exclusively through Blanka&apos;s certified white-label manufacturing network.
            </p>
            <ul className='list-disc pl-5 space-y-2'>
              <li><strong>Clean Formulation Standard:</strong> Every Botanics SKU is free from parabens, sulphates, synthetic fragrances, and PFAS chemicals. Formulations are verified against the EU Cosmetics Regulation 1223/2009 banned substances list.</li>
              <li><strong>Cruelty-Free Sourcing:</strong> All suppliers in the Botanics network hold Leaping Bunny or PETA-certified cruelty-free status.</li>
              <li><strong>Minimal-Waste Packaging:</strong> Glass and PCR (post-consumer recycled) plastic packaging is prioritised over virgin plastic for all Botanics products.</li>
              <li><strong>Direct Supplier Relationships:</strong> We audit Botanics suppliers annually against environmental management criteria aligned with ISO 14001 principles.</li>
            </ul>
          </section>

          {/* 4. Packaging Standards */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
              <Package className='w-4 h-4 text-amber-500' /> 4. Packaging Standards
            </h2>
            <p className='mb-3'>
              Our packaging philosophy is <strong>minimum viable packaging</strong> — the smallest, lightest, most recyclable enclosure that safely delivers your order.
            </p>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs border-collapse'>
                <thead>
                  <tr className='bg-gray-100 dark:bg-gray-800'>
                    <th className='text-left p-3 font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'>Standard</th>
                    <th className='text-left p-3 font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Blind Shipping', 'No supplier name, factory logo, or third-party branding on any external surface.'],
                    ['No Marketing Inserts', 'We do not include paper flyers, coupon cards, or branded collateral in parcels.'],
                    ['Single-Parcel Policy', 'Multi-item orders are consolidated where feasible to reduce total packaging volume.'],
                    ['Recyclable Outer', 'Cardboard mailers rated ≥80% recycled content; poly mailers restricted to recycled LDPE.'],
                    ['No Bubble Wrap', 'Paper void-fill and honeycomb padding replace single-use plastic bubble wrap across all SKUs.'],
                  ].map(([std, detail], i) => (
                    <tr key={i} className='border border-gray-200 dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/30'>
                      <td className='p-3 font-medium text-gray-800 dark:text-gray-200'>{std}</td>
                      <td className='p-3 text-gray-600 dark:text-gray-400'>{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Callout */}
          <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200'>
            <strong>Sustainability feedback?</strong> We publish an annual impact summary and welcome supplier nominations at{' '}
            <span className='font-mono underline'>sustainability@omnistu.com</span>.
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
