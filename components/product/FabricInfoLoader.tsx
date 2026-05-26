'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight } from 'lucide-react'

interface FabricGuide {
  name: string; tagline: string; description: string
  care_instructions: string; occasions: string[]; price_range: string; slug: string
}

export default function FabricInfoLoader({ fabric, onClose }: { fabric: string; onClose: () => void }) {
  const [data, setData] = useState<FabricGuide | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('fabric_guides')
      .select('*')
      .ilike('name', `%${fabric}%`)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => { setData(data); setLoading(false) })
  }, [fabric])

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!data) return (
    <div className="p-6 text-center">
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>No guide found for {fabric} yet.</p>
      <Link href="/fabric-guide" onClick={onClose} className="text-sm font-medium" style={{ color: 'var(--crimson)' }}>View full fabric guide →</Link>
    </div>
  )

  return (
    <div className="p-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>
      {data.tagline && <p className="text-xs italic mb-3" style={{ color: 'var(--gold)' }}>{data.tagline}</p>}
      {data.description && <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>{data.description}</p>}
      {data.care_instructions && (
        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--cream)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--gold)' }}>Care</p>
          <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{data.care_instructions}</p>
        </div>
      )}
      {data.price_range && <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Typical price range: <span style={{ color: 'var(--crimson)' }}>{data.price_range}</span></p>}
      <div className="flex gap-2">
        <Link href="/fabric-guide" onClick={onClose}
          className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--crimson)' }}>
          Full fabric guide <ChevronRight size={11} />
        </Link>
      </div>
    </div>
  )
}
