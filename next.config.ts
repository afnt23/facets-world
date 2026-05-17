import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingExcludes: {
    "*": ["./public/pictures/**/*"],
  },
};

export default nextConfig;
