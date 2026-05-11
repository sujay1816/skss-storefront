import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import FaqClient from './FaqClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  const brandName = cfg.brand_name || 'Sai Krishna Silks & Sarees'

  return {
    title: 'Frequently Asked Questions',
    description: `Find answers to common questions about our sarees, shipping, returns, payments and more.`,
    alternates: { canonical: `${SITE_URL}/faq` },
    openGraph: {
      title: `Frequently Asked Questions | ${brandName}`,
      description: `Find answers to common questions about our sarees, shipping, returns, payments and more.`,
      type: 'website',
      url: `${SITE_URL}/faq`,
    },
  }
}

export default async function FaqPage() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['faq_items', 'brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  // FAQ Schema for Google rich results
  let faqSchema = null
  try {
    const items = JSON.parse(cfg.faq_items || '[]')
    if (items.length > 0) {
      faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item: any) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }
    }
  } catch {}

  return (
    <>
      {faqSchema && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <FaqClient cfg={cfg} />
    </>
  )
}
