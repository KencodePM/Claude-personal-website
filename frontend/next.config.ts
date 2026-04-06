import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'standalone' is for Docker/self-hosting only — Vercel manages its own bundling
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost' }, { protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
