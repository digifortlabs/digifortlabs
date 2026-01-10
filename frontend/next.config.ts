import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable if using S3 images in future
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  experimental: {
    // allowedDevOrigins removed as it is invalid in this Next.js version
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
