import { createClient } from '@/lib/supabase/server'
import FaqClient from './FaqClient'

export default async function FaqPage() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['faq_items', 'brand_name'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  return <FaqClient cfg={cfg} />
}
