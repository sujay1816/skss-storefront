import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AboutClient from './AboutClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  const brandName = cfg.brand_name || 'Sai Krishna Silks & Sarees'

  return {
    title: 'About Us',
    description: `Learn about our legacy of silk sarees. Handpicked from the finest looms across India — Kanjivaram, Banarasi, Chanderi and more.`,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
      title: `About Us | ${brandName}`,
      description: `Learn about our legacy of silk sarees. Handpicked from the finest looms across India — Kanjivaram, Banarasi, Chanderi and more.`,
      type: 'website',
      url: `${SITE_URL}/about`,
    },
  }
}

export default async function AboutPage() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['about_content', 'about_title', 'brand_name', 'logo_url'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  return <AboutClient cfg={cfg} />
}
