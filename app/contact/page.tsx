import { createClient } from '@/lib/supabase/server'
import ContactClient from './ContactClient'

export default async function ContactPage() {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
    .in('key', ['brand_name', 'whatsapp_number', 'support_email', 'business_address', 'contact_hours', 'contact_map_url'])
  const cfg: Record<string, string> = {}
  data?.forEach((r: any) => { cfg[r.key] = r.value })
  return <ContactClient cfg={cfg} />
}
