import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Baseline security headers on every response. No CSP: checkout providers
  // (Stripe/PayPal) and upload tooling load third-party scripts, and a wrong
  // allowlist is worse than none while commerce is in test mode.
  // HSTS is apex-only (no includeSubDomains) so other subdomain hosts are
  // unaffected. No app code uses iframes, so framing is denied outright.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
        ],
      },
    ];
  },
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
      // Marketing pages built on fabricated current-capability claims
      // (supplier networks, AI sourcing engine, live fulfillment operations
      // that do not exist). Redirected until the owner approves wording.
      { source: '/about', destination: '/', permanent: false },
      { source: '/about/:path*', destination: '/', permanent: false },
      { source: '/press', destination: '/', permanent: false },
      { source: '/press/:path*', destination: '/', permanent: false },
      { source: '/sustainability', destination: '/', permanent: false },
      { source: '/sustainability/:path*', destination: '/', permanent: false },
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
