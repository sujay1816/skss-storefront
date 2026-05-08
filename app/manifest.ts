import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RN Bros — Silk Sarees',
    short_name: 'RN Bros',
    description: 'Shop pure silk sarees online. Kanjivaram, Banarasi, Chanderi and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FDFAF7',
    theme_color: '#8B1A2B',
    orientation: 'portrait',
    icons: [
      { src: '/images/logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    categories: ['shopping', 'fashion'],
    lang: 'en-IN',
  }
}
