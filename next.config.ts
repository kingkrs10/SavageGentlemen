import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/apps/piana-learning-app',
        destination: '/apps/piana-learning-app/index.html',
        permanent: false,
      },
      {
        source: '/apps/piana-learning-app/',
        destination: '/apps/piana-learning-app/index.html',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
