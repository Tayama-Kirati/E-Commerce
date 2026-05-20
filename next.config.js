const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: path.join(__dirname)
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/apps/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;