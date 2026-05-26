import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import WeaversClient from './WeaversClient'

export const metadata: Metadata = {
  title: 'Our Weavers — The Artisans Behind Every Saree',
  description: 'Meet the master weavers and artisans who craft every saree with generations of skill and tradition.',
}

export const revalidate = 3600

export default async function WeaversPage() {
  const supabase = createClient()
  const { data: weavers } = await supabase
    .from('weavers').select('*').eq('is_active', true).order('display_order')
  return <WeaversClient weavers={weavers || []} />
}
