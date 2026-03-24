import type { NextConfig } from "next";

// Updated: 2024-03-24 - Production ready config with auth
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    // Enable Turbopack for dev (already default in Next.js 16)
  },
};

export default nextConfig;
