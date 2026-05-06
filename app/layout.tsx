import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import AuthListener from '@/components/AuthListener'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = createClient()
    const { data } = await supabase.from('site_config').select('key, value').in('key', ['brand_name', 'brand_tagline'])
    const cfg: Record<string, string> = {}
    data?.forEach((r: any) => { cfg[r.key] = r.value })
    const name = cfg.brand_name || 'Sai Krishna Silks and Sarees'
    const tagline = cfg.brand_tagline || 'Pure Silk. Timeless Tradition. Royal Elegance.'
    return {
      title: { default: `${name} — ${tagline}`, template: `%s | ${name}` },
      description: `Shop the finest silk and traditional sarees at ${name}. ${tagline}`,
      keywords: 'sarees, silk sarees, kanjivaram, banarasi, bridal sarees, buy sarees online India',
    }
  } catch {
    return { title: 'Sai Krishna Silks and Sarees', description: 'Pure Silk. Timeless Tradition. Royal Elegance.' }
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
    const { data } = await supabase.from('site_config').select('key, value').in('key', Object.keys(DEFAULT_BRAND))
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
  const cssVars = `
    :root {
      --crimson: ${brand.color_primary};
      --crimson-dark: ${adjustColor(brand.color_primary, -20)};
      --crimson-light: ${adjustColor(brand.color_primary, 20)};
      --gold: ${brand.color_accent};
      --gold-dark: ${adjustColor(brand.color_accent, -20)};
      --gold-light: ${brand.color_accent};
      --cream: ${brand.color_background};
      --cream-dark: ${adjustColor(brand.color_background, -10)};
      --ivory: ${brand.color_page_bg};
      --font-heading: '${brand.font_heading}', serif;
      --font-body: '${brand.font_body}', sans-serif;
    }
  `
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontsUrl} rel="stylesheet" />
        <link rel="icon" href={brand.logo_url || '/images/logo.png'} />
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body>
        <AuthListener />
        {children}
        <Toaster position="bottom-center" toastOptions={{
          style: { background: '#1A1A1A', color: 'white', fontFamily: `'${brand.font_body}', sans-serif`, fontSize: '13px', borderRadius: '2px' },
          success: { iconTheme: { primary: brand.color_accent, secondary: 'white' } },
          error: { iconTheme: { primary: brand.color_primary, secondary: 'white' } }
        }} />
      </body>
    </html>
  )
}
