import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/shoot-til-dawn',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
