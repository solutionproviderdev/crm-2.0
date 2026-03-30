import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.68.111', 'localhost:3000'],
  cacheComponents: true,
};

export default nextConfig;
