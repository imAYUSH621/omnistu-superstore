import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Unbuilt-feature orphan pages (/affiliates program, /currency policy)
  // redirect to home on public builds. The content-review build
  // (NEXT_PUBLIC_CONTENT_REVIEW=true, protected preview only) skips these
  // so the owner can review the drafts there. Edge-level 307: no page
  // render, no metadata, no draft copy is ever served publicly.
  async redirects() {
    if (process.env.NEXT_PUBLIC_CONTENT_REVIEW === 'true') return [];
    return [
      { source: '/affiliates', destination: '/', permanent: false },
      { source: '/affiliates/:path*', destination: '/', permanent: false },
      { source: '/currency', destination: '/', permanent: false },
      { source: '/currency/:path*', destination: '/', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images.printify.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images-api.printify.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.cjdropshipping.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.aliyuncs.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;
