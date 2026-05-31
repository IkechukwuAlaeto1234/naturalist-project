import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["country-state-city"],
  async rewrites() {
    return [
      {
        source: "/cdn/:path*",
        destination: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || "dtpwhaxvh"}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
