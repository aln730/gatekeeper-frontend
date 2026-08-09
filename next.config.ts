import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.csh.rit.edu" },
      { protocol: "https", hostname: "profiles.csh.rit.edu" },
    ],
  },
};

export default nextConfig;
