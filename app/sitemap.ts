import type { MetadataRoute } from 'next';
import { catalogSource } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://omnistu-superstore.vercel.app';

// /bestsellers/* only renders in sample mode (it redirects otherwise), and
// /blog and /bestsellers/fashion have no page, so none are listed unconditionally.
export default function sitemap(): MetadataRoute.Sitemap {
  const sampleOnly: MetadataRoute.Sitemap =
    catalogSource() === 'sample'
      ? ['toys-and-games', 'electronics'].map((c) => ({
          url: `${BASE_URL}/bestsellers/${c}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        }))
      : [];
  return [
    ...sampleOnly,
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      // /s only redirects here; sitemaps list the canonical destination.
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];
}
