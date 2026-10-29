import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'm.media-amazon.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;
