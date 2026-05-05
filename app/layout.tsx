import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthListener from '@/components/AuthListener'

export const metadata: Metadata = {
  title: { default: 'Sai Krishna Silks and Sarees — Pure Silk. Timeless Tradition. Royal Elegance.', template: '%s | Sai Krishna Silks and Sarees' },
  description: 'Shop the finest silk and traditional sarees. Pure Silk. Timeless Tradition. Royal Elegance.',
  keywords: 'sarees, silk sarees, kanjivaram, banarasi, bridal sarees, buy sarees online India',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="/images/logo.png" />
      </head>
      <body>
        <AuthListener />
        {children}
        <Toaster position="bottom-center" toastOptions={{
          style: { background: '#1A1A1A', color: 'white', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', borderRadius: '2px' },
          success: { iconTheme: { primary: '#C9A84C', secondary: 'white' } },
          error: { iconTheme: { primary: '#8B1A2B', secondary: 'white' } }
        }} />
      </body>
    </html>
  )
}
