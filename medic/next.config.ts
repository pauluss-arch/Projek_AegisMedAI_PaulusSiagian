import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/katalog', destination: '/catalog', permanent: true },
      { source: '/katalog/:path*', destination: '/catalog', permanent: true },
    ];
  },
};

export default nextConfig;
