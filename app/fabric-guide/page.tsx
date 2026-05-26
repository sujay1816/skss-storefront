import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import FabricGuideClient from './FabricGuideClient'

export const metadata: Metadata = {
  title: 'Fabric Guide — Know Your Silk',
  description: 'A complete guide to silk saree fabrics — Kanjivaram, Banarasi, Chanderi, Tussar and more. Learn care instructions, occasions, and pricing.',
}

export const revalidate = 3600 // 1 hour

export default async function FabricGuidePage() {
  const supabase = createClient()
  const { data: fabrics } = await supabase
    .from('fabric_guides')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  return <FabricGuideClient fabrics={fabrics || []} />
}
