/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Headers for SEO, performance, and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          // FIX #14: Content-Security-Policy header
          // Allows Razorpay checkout script, Supabase API, and Google OAuth
          // Adjust 'img-src' if you serve product images from additional CDNs
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts + Razorpay checkout JS
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
              // Supabase realtime, auth, and storage; Google OAuth; Razorpay API
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://apiv2.shiprocket.in https://www.fast2sms.com",
              // Google fonts and self
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Product images from Cloudinary, Supabase storage, and Google avatars
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://lh3.googleusercontent.com",
              // Videos from Cloudinary (hero banner background video)
              "media-src 'self' blob: https://res.cloudinary.com https://*.supabase.co",
              // Razorpay payment iframe
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              // form-action self only
              "form-action 'self'",
              // base-uri self
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/(.*)\\.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.jpeg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.avif',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)\\.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Redirects for SEO
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
      { source: '/products', destination: '/shop', permanent: true },
    ]
  },

  // Powered by header
  poweredByHeader: false,
}

module.exports = nextConfig
