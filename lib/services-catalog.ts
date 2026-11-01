/**
 * Omnistu Services catalog (data only).
 *
 * Source: the offerings the owner described for Omnistu (company record,
 * 2026-10-23/24/26): software development and product launches, premium
 * websites, ready-made apps, AI services, marketing/ads/influencer work,
 * automation, and vertical SaaS packages. Wording here is deliberately
 * descriptive only: NO prices, delivery times, guarantees, client names,
 * counts or case-study claims. Owner review of titles and summaries is still
 * pending; edit this file to change what /services shows.
 */
export interface ServiceItem {
  slug: string;
  title: string;
  summary: string;
  /** Short, claim-free bullets describing the kind of work. */
  covers: string[];
}

export const SERVICES: ServiceItem[] = [
  {
    slug: 'software-development',
    title: 'Software development and product launches',
    summary: 'Custom software built and launched as a complete product.',
    covers: ['Web and mobile products', 'Backend and integrations', 'Launch support'],
  },
  {
    slug: 'websites',
    title: 'Premium websites',
    summary: 'Dynamic, design-led websites, including 3D and animated experiences.',
    covers: ['Brand and marketing sites', 'Interactive and 3D pages', 'Content structure and performance'],
  },
  {
    slug: 'ready-made-apps',
    title: 'Ready-made apps',
    summary: 'Pre-built app foundations that can be adapted to a business instead of starting from zero.',
    covers: ['Marketplace and on-demand style apps', 'Customisation to your brand and workflow'],
  },
  {
    slug: 'ai-services',
    title: 'AI services',
    summary: 'AI features and assistants added to a business or product.',
    covers: ['Site and support assistants', 'Workflow assistance'],
  },
  {
    slug: 'marketing',
    title: 'Marketing, ads and influencer work',
    summary: 'Creative, advertising and influencer campaigns.',
    covers: ['Creative and ad content', 'Influencer marketing', 'Campaign planning'],
  },
  {
    slug: 'automation',
    title: 'Automation',
    summary: 'Automating repeated business tasks, including scheduled publishing across social channels.',
    covers: ['Scheduled social publishing', 'Back-office workflow automation'],
  },
  {
    slug: 'vertical-saas',
    title: 'Vertical SaaS for industries',
    summary: 'Packaged systems that combine the tools an industry needs to run its workflow.',
    covers: ['Real estate', 'Healthcare', 'Teaching and coaching'],
  },
];

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);
