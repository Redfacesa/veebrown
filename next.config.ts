import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'bpzzgilwlkghgfkvkkxx.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
