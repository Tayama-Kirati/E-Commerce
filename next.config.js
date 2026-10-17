const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: path.join(__dirname)
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Sign-in lives inside the single-page app; query params (callbackUrl, verified) are kept
      { source: '/login', destination: '/?page=login', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/apps/api/:path*',
      },
      // Clean public URLs for the routed pages (also used in emails and the sitemap)
      { source: '/products/:slug', destination: '/apps/shop/products/:slug' },
      { source: '/categories/:slug', destination: '/apps/shop/categories/:slug' },
      { source: '/search', destination: '/apps/shop/search' },
      { source: '/cart', destination: '/apps/shop/cart' },
      { source: '/checkout', destination: '/apps/shop/checkout' },
      { source: '/track', destination: '/apps/shop/track' },
      { source: '/account/:path*', destination: '/apps/account/:path*' },
      { source: '/seller/onboarding', destination: '/apps/shop/seller/onboarding' },
      { source: '/seller/:path*', destination: '/apps/seller/:path*' },
      { source: '/admin', destination: '/apps/admin' },
      { source: '/admin/:path*', destination: '/apps/admin/:path*' },
      { source: '/register', destination: '/apps/auth/register' },
      { source: '/forgot-password', destination: '/apps/auth/forgotpassword' },
      { source: '/reset-password', destination: '/apps/auth/reset-password' },
    ];
  },
};

module.exports = nextConfig;
