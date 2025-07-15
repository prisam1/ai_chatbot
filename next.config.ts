import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  },
};

export default nextConfig;

