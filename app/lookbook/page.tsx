import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import LookbookClient from './LookbookClient'

export const metadata: Metadata = {
  title: 'Lookbook — Styled Sarees in Real Life',
  description: 'Browse our lookbook — styled sarees worn for weddings, festive occasions and everyday elegance.',
}

export const revalidate = 3600

export default async function LookbookPage() {
  const supabase = createClient()
  const { data: photos } = await supabase
    .from('lookbook_photos').select('*').eq('is_active', true).order('display_order')
  return <LookbookClient photos={photos || []} />
}
