import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Link2, DollarSign, HelpCircle } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Affiliate Program | ${APP_NAME}`,
  description:
    'Join the Omnistu Creator Network. Earn 8–15% commission on every sale, get monthly payouts, and access your dedicated affiliate dashboard.',
};

export default function AffiliatesPage() {
  return (
    <div className='w-full min-h-screen bg-[#eaeded] dark:bg-[#0f1111] py-8 px-4 sm:px-6 font-["Amazon_Ember",Arial,sans-serif]'>
      <div className='max-w-[960px] mx-auto bg-white dark:bg-[#1a1e24] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-10'>

        {/* Header */}
        <div className='border-b border-gray-200 dark:border-gray-800 pb-6 mb-8'>
          <div className='flex items-center gap-3 text-amber-600 mb-2'>
            <Users className='w-7 h-7' />
            <span className='text-xs font-bold uppercase tracking-wider'>Creator Program</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white'>
            Join the Omnistu Creator Network
          </h1>
          <p className='text-sm text-gray-500 mt-2'>
            Earn real commissions promoting products your audience actually loves — no minimum follower count to apply.
          </p>
        </div>

        {/* Content */}
        <div className='space-y-10 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>

          {/* How It Works */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2'>
              <Link2 className='w-4 h-4 text-amber-500' /> How It Works
            </h2>
            <div className='grid sm:grid-cols-3 gap-6'>
              {[
                {
                  step: '01',
                  title: 'Apply',
                  desc: 'Submit your application with your platform, niche, and audience details. No follower minimum — we evaluate engagement quality over vanity metrics.',
                },
                {
                  step: '02',
                  title: 'Get Your Unique Link',
                  desc: 'Upon approval, access your affiliate dashboard to generate trackable deep links to any product in the Omnistu catalog.',
                },
                {
                  step: '03',
                  title: 'Earn 8–15% Commission',
                  desc: 'Every completed purchase through your link earns you a commission on the net product value. Commission rate scales with monthly volume.',
                },
              ].map((s) => (
                <div key={s.step} className='border border-gray-200 dark:border-gray-700 rounded-lg p-5'>
                  <div className='text-3xl font-extrabold text-amber-500 mb-2'>{s.step}</div>
                  <div className='font-bold text-gray-900 dark:text-white mb-2'>{s.title}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Commission Tiers */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
              <DollarSign className='w-4 h-4 text-amber-500' /> Commission Tiers
            </h2>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs border-collapse'>
                <thead>
                  <tr className='bg-gray-100 dark:bg-gray-800'>
                    <th className='text-left p-3 font-semibold border border-gray-200 dark:border-gray-700'>Tier</th>
                    <th className='text-left p-3 font-semibold border border-gray-200 dark:border-gray-700'>Monthly Sales Volume</th>
                    <th className='text-left p-3 font-semibold border border-gray-200 dark:border-gray-700'>Commission Rate</th>
                    <th className='text-left p-3 font-semibold border border-gray-200 dark:border-gray-700'>Bonus Perks</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Starter', '\$0 – \$999', '8%', 'Dashboard access, link generator'],
                    ['Growth', '\$1,000 – \$4,999', '10%', '+ Early product access'],
                    ['Pro', '\$5,000 – \$19,999', '12%', '+ Priority support channel'],
                    ['Elite', '\$20,000+', '15%', '+ Co-branded landing pages, dedicated AM'],
                  ].map(([tier, vol, rate, perks], i) => (
                    <tr key={i} className='border border-gray-200 dark:border-gray-700 even:bg-gray-50 dark:even:bg-gray-800/30'>
                      <td className='p-3 font-medium text-gray-800 dark:text-gray-200'>{tier}</td>
                      <td className='p-3'>{vol}</td>
                      <td className='p-3 font-bold text-amber-600'>{rate}</td>
                      <td className='p-3 text-gray-500'>{perks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Benefits */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
              <Users className='w-4 h-4 text-amber-500' /> Creator Benefits
            </h2>
            <div className='grid sm:grid-cols-2 gap-4'>
              {[
                { title: 'Monthly Payouts', desc: 'Commissions are calculated on the 1st and paid by the 7th of each month via PayPal, bank transfer, or UPI (India).' },
                { title: 'Dedicated Dashboard', desc: 'Real-time click, conversion, and earnings analytics. Generate deep links to any product page in seconds.' },
                { title: 'Early Product Access', desc: 'Growth+ creators get 48-hour advance access to new drops, Botanics launches, and AI Apparel Lab releases.' },
                { title: 'No Cookie Expiry Cap', desc: 'Our affiliate cookies persist for 30 days — any purchase within 30 days of a click is attributed to you.' },
                { title: 'Free Product Seeding', desc: 'Elite tier creators are eligible for complimentary product samples for authentic review content.' },
                { title: 'Zero Cost to Join', desc: 'No application fee, no subscription, no minimum sales threshold to stay active.' },
              ].map((b) => (
                <div key={b.title} className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <div className='font-bold text-gray-900 dark:text-white mb-1 text-xs'>{b.title}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>{b.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className='text-center'>
            <a
              href='mailto:affiliates@omnistu.com?subject=Affiliate Program Application'
              className='inline-block bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 px-8 rounded-lg text-sm transition-colors'
            >
              Apply Now — affiliates@omnistu.com
            </a>
            <p className='text-xs text-gray-500 mt-3'>
              Include your platform links, niche, and estimated monthly reach. We review applications within 3 business days.
            </p>
          </section>

          {/* FAQ */}
          <section>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
              <HelpCircle className='w-4 h-4 text-amber-500' /> Frequently Asked Questions
            </h2>
            <div className='space-y-4'>
              {[
                {
                  q: 'Is there a minimum follower count to apply?',
                  a: 'No. We evaluate engagement quality, content relevance, and audience fit rather than raw follower numbers. Micro-influencers with highly engaged niche audiences are welcome.',
                },
                {
                  q: 'What are the commission rates?',
                  a: 'Commission rates range from 8% (Starter) to 15% (Elite) based on your monthly gross sales volume. Rates are calculated on the net product price excluding shipping and taxes.',
                },
                {
                  q: 'When and how are payments made?',
                  a: 'Payments are processed monthly: calculated on the 1st, paid by the 7th via PayPal, bank wire, or UPI. Minimum payout threshold is \$25 USD.',
                },
                {
                  q: 'Which product categories are eligible for commission?',
                  a: 'All products in the Omnistu catalog are eligible, including apparel, electronics, home goods, and Botanics beauty products. Certain flash-sale SKUs may carry a reduced rate, which will be clearly indicated in your dashboard.',
                },
                {
                  q: 'Can I promote on multiple platforms?',
                  a: 'Yes. Your affiliate link works across Instagram, YouTube, TikTok, Pinterest, blog posts, newsletters, and any other channel. You can create separate tracking links per platform in your dashboard.',
                },
                {
                  q: 'What happens if a customer returns an order?',
                  a: 'Commission on returned orders is reversed. Commissions are locked and paid only after the 30-day return window has closed for each attributed order.',
                },
              ].map((faq, i) => (
                <div key={i} className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <div className='font-semibold text-gray-900 dark:text-white mb-1 text-xs'>{faq.q}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400'>{faq.a}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Callout */}
          <div className='bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-4 text-xs text-amber-900 dark:text-amber-200'>
            <strong>Already a partner?</strong> Log in to your affiliate dashboard or contact{' '}
            <span className='font-mono underline'>affiliates@omnistu.com</span> for account support.
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
