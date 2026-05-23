import { MetadataRoute } from 'next'

// FIX: Brand name was hardcoded as 'RN Bros'. Now reads from env var.
// Set NEXT_PUBLIC_BRAND_NAME in Vercel env vars to your actual brand name.
const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Sai Krishna Silks & Sarees'
const SHORT_NAME = process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || 'SKSS'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME}`,
    short_name: SHORT_NAME,
    description: 'Shop pure silk sarees online. Kanjivaram, Banarasi, Chanderi and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFAF7',
    theme_color: '#8B1A2B',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['shopping', 'fashion'],
    lang: 'en-IN',
  }
}
