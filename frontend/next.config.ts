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
    // @ts-expect-error - allowedDevOrigins is valid but missing from Next.js types in this version
    allowedDevOrigins: ["localhost", "100.100.100.100"],
  },
};

export default nextConfig;
