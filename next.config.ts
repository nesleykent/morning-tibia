import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "morning-tibia";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  // GitHub Pages serves this project site at /morning-tibia/, not the domain root.
  // Local dev and `vercel`-style deploys don't set GITHUB_PAGES, so basePath stays empty there.
  basePath: isGithubPages ? `/${repoName}` : "",
  images: {
    unoptimized: true,
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
