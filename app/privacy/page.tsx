import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  const brandName = cfg.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'

  return {
    title: 'Privacy Policy',
    description: `Read our privacy policy to understand how we collect, use and protect your personal information.`,
    alternates: { canonical: `${SITE_URL}/privacy` },
    openGraph: {
      title: `Privacy Policy | ${brandName}`,
      description: `Read our privacy policy to understand how we collect, use and protect your personal information.`,
      type: 'website',
      url: `${SITE_URL}/privacy`,
    },
  }
}

export default async function Page() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['privacy_content', 'privacy_title', 'brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })

  const title = cfg['privacy_title'] || 'Privacy Policy'
  const content = cfg['privacy_content'] || ''

  return (
    <div className="page-container py-16 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Privacy Policy</p>
        <h1 className="text-4xl font-light" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
        <div className="w-full h-px mt-6" style={{ background: 'linear-gradient(to right, var(--gold), transparent)' }} />
      </div>
      {content ? (
        <div className="prose-custom" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-lg font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Content coming soon</p>
          <p className="text-sm">Update this page from Admin → Pages</p>
        </div>
      )}
    </div>
  )
}
