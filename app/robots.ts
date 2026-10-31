import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://omnistu-superstore.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/checkout', '/cart', '/order/', '/place-order', '/shipping-address', '/payment-method'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
