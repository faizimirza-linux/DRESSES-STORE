import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product photos are temporarily stored as optimized data URLs in the
  // product record, so publishing needs more than the default action limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
