import type { NextConfig } from 'next'

// next-pwa uses webpack; disable Turbopack for compatibility
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supabase-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      urlPattern: /\.(js|css|woff2?|png|jpg|svg|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 100, maxAgeSeconds: 2592000 },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 },
    },
  ],
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},   // silence the Turbopack warning; next-pwa uses webpack in prod
}

module.exports = withPWA(nextConfig)
