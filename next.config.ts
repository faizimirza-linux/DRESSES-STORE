import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product photos are temporarily stored as optimized data URLs in the
  // product record, so publishing needs more than the default action limit.
  experimental: {
    serverActions: {
      // Vercel Functions reject requests above 4.5 MB before Next.js runs.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
