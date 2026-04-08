import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  // 'standalone' is for Docker/self-hosting only — Vercel manages its own bundling
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost' }, { protocol: 'https', hostname: '**' }],
  },
  // Proxy /api/* to the backend to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
