import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['shipping_content', 'shipping_content_title', 'brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })

  const title = cfg['shipping_content_title'] || 'Shipping Policy'
  const content = cfg['shipping_content'] || ''

  return (
    <div className="page-container py-16 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Shipping Policy</p>
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
