import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.tibia.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
