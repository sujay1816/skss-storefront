import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthListener from '@/components/AuthListener'
import PageProgress from '@/components/layout/PageProgress'
import PullToRefresh from '@/components/layout/PullToRefresh'
import { Suspense } from 'react'
import FontLoader from '@/components/layout/FontLoader'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'
const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('site_config').select('key, value')
      .in('key', ['brand_name', 'brand_tagline', 'logo_url', 'support_email'])
    const cfg: Record<string, string> = {}
    data?.forEach((r: any) => { cfg[r.key] = r.value })

    const name = cfg.brand_name || BRAND_NAME
    const tagline = cfg.brand_tagline || 'Pure Silk. Timeless Tradition. Royal Elegance.'
    const logo = cfg.logo_url || ''
    const desc = `Shop the finest silk and traditional sarees at ${name}. ${tagline} Kanjivaram, Banarasi, Chanderi and more. Free shipping above ₹1,999.`

    return {
      title: {
        default: `${name} — ${tagline}`,
        template: `%s | ${name}`,
      },
      description: desc,
      keywords: [
        'sarees online', 'silk sarees', 'buy sarees India',
        'kanjivaram saree', 'banarasi silk saree', 'bridal saree',
        'handloom sarees', 'traditional sarees', 'pure silk saree',
        'wedding saree', 'festive sarees', 'designer sarees',
        name.toLowerCase(), 'sarees online shopping',
      ],
      authors: [{ name }],
      creator: name,
      publisher: name,
      metadataBase: new URL(SITE_URL),
      alternates: { canonical: SITE_URL },
      openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: SITE_URL,
        siteName: name,
        title: `${name} — ${tagline}`,
        description: desc,
        images: logo ? [{ url: logo, width: 1200, height: 630, alt: name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} — ${tagline}`,
        description: desc,
        images: logo ? [logo] : [],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
      },
    }
  } catch {
    return {
      title: `${BRAND_NAME} — Premium Silk Sarees`,
      description: 'Shop pure silk sarees online. Kanjivaram, Banarasi, Chanderi and more.',
    }
  }
}

const DEFAULT_BRAND = {
  color_primary: '#8B1A2B',
  color_accent: '#C9A84C',
  color_background: '#F5EDE3',
  color_page_bg: '#FDFAF7',
  font_heading: 'Cormorant Garamond',
  font_body: 'DM Sans',
  logo_url: '',
}

function adjustColor(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  } catch { return hex }
}

async function getBrandConfig() {
  try {
    const supabase = createClient()
    const keys = [...Object.keys(DEFAULT_BRAND), 'instagram_url', 'facebook_url', 'youtube_url', 'whatsapp_number', 'support_email', 'business_address', 'contact_map_url', 'brand_name']
    const { data } = await supabase.from('site_config').select('key, value').in('key', keys)
    const cfg: Record<string, string> = { ...DEFAULT_BRAND }
    data?.forEach((r: any) => { if (r.value) cfg[r.key] = r.value })
    return cfg
  } catch { return DEFAULT_BRAND }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrandConfig()
  const headingFont = brand.font_heading.replace(/ /g, '+')
  const bodyFont = brand.font_body.replace(/ /g, '+')
  const fontsUrl = `https://fonts.googleapis.com/css2?family=${headingFont}:ital,wght@0,300;0,400;0,600;1,300;1,400&family=${bodyFont}:wght@300;400;500&display=swap`

  const primary = brand.color_primary || '#8B1A2B'
  const cssVars = `
    :root {
      --crimson: ${primary};
      --crimson-dark: ${adjustColor(primary, -30)};
      --crimson-light: ${adjustColor(primary, 20)};
      --gold: ${brand.color_accent || '#C9A84C'};
      --gold-dark: ${adjustColor(brand.color_accent || '#C9A84C', -20)};
      --gold-light: ${adjustColor(brand.color_accent || '#C9A84C', 15)};
      --cream: ${brand.color_background || '#F5EDE3'};
      --cream-dark: ${adjustColor(brand.color_background || '#F5EDE3', -15)};
      --ivory: ${brand.color_page_bg || '#FDFAF7'};
      --font-heading: '${brand.font_heading}', serif;
      --font-body: '${brand.font_body}', sans-serif;
      --text-primary: #1A1A1A;
      --text-secondary: #5A4A3A;
      --border: #E8DDD4;
    }
  `


  const b = brand as any

  // Organization structured data
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: b.brand_name || BRAND_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: b.logo_url || '',
      width: 512,
      height: 512,
    },
    sameAs: [b.instagram_url, b.facebook_url, b.youtube_url].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: b.whatsapp_number || '',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi', 'Tamil', 'Telugu'],
    },
  }

  // LocalBusiness / ClothingStore schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: b.brand_name || BRAND_NAME,
    url: SITE_URL,
    image: b.logo_url || '',
    description: `Premium silk sarees — Kanjivaram, Banarasi, Chanderi and more. Shop online with free shipping.`,
    priceRange: '₹₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking, COD',
    areaServed: 'India',
    hasMap: b.contact_map_url || undefined,
    telephone: b.whatsapp_number || undefined,
    email: b.support_email || undefined,
    address: b.business_address ? {
      '@type': 'PostalAddress',
      streetAddress: b.business_address,
      addressCountry: 'IN',
    } : undefined,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      opens: '10:00',
      closes: '19:00',
    },
  }

  // WebSite structured data with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: b.brand_name || BRAND_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* FIX: Non-blocking font loading — rel=preload + onload prevents render-blocking
            on slow 3G connections (common on budget Android in India).
            The font still loads and swaps in (display=swap is in the URL),
            but the browser doesn't wait for it before first paint. */}
        <link rel="preload" as="style" href={fontsUrl} />
        {/* Non-blocking: load as print, swap to all on load — prevents render-blocking on slow 3G */}
        <link rel="stylesheet" href={fontsUrl} media="print" />
        <noscript><link rel="stylesheet" href={fontsUrl} /></noscript>
        {brand.logo_url && <link rel="icon" href={brand.logo_url} />}
        {brand.logo_url && <link rel="apple-touch-icon" href={brand.logo_url} />}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body>
        {/* A11y: Skip to main content link — first tab stop for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
          style={{ background: 'var(--crimson)', color: 'white', borderRadius: 4 }}>
          Skip to main content
        </a>
        <Toaster position="top-center" toastOptions={{ duration: 3000, style: { fontFamily: 'var(--font-body)', fontSize: '13px' } }} />
        <Suspense fallback={null}><PageProgress /></Suspense>
        <PullToRefresh />
        <FontLoader />
        <AuthListener />
        {/* GA4 / Meta Pixel: Add your tracking scripts here once you have your IDs.
            Use next/script with strategy="afterInteractive" so they don't block render.
            Example:
            <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `}</Script>
        */}
        <div id="main-content">{children}</div>
      </body>
    </html>
  )
}
