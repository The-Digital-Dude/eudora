import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@guidora/ui", "@guidora/contracts"]
};

export default nextConfig;
