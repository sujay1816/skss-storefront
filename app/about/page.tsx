import { createClient } from '@/lib/supabase/server'
import AboutClient from './AboutClient'

export default async function AboutPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('site_config')
    .select('key, value')
    .in('key', ['about_content', 'about_title', 'brand_name', 'logo_url'])

  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })

  return <AboutClient cfg={cfg} />
}
