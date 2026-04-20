import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable static export for simple hosting (remove if using SSR features)
  // output: 'export',

  images: {
    // Add external image domains here if needed
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
