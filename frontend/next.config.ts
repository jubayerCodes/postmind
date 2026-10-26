import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Docker, but allow Vercel to use its native packaging
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
