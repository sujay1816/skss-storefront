'use client'
import { useCompareStore } from '@/lib/store/compare'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, GitCompare } from 'lucide-react'

export default function CompareBar() {
  const { items, remove, clear } = useCompareStore()
  const router = useRouter()

  if (items.length < 2) return null   // Only show when 2+ selected

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{ background: 'rgba(26,26,26,0.96)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 560, width: '100%' }}>

        {/* Product thumbnails */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {items.map(p => {
            const img = p.images?.find(i => i.isPrimary) || p.images?.[0]
            return (
              <div key={p.id} className="relative flex-shrink-0">
                <div className="w-10 h-14 rounded overflow-hidden" style={{ background: 'var(--cream)' }}>
                  {img ? (
                    <Image src={img.url} alt={p.name} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🥻</div>
                  )}
                </div>
                <button type="button" onClick={() => remove(p.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                  aria-label={`Remove ${p.name} from comparison`}>
                  <X size={9} />
                </button>
              </div>
            )
          })}
          {items.length < 3 && (
            <div className="w-10 h-14 rounded border-2 border-dashed flex items-center justify-center flex-shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>
              +
            </div>
          )}
          <div className="min-w-0 ml-1">
            <p className="text-white text-xs font-medium">{items.length} product{items.length > 1 ? 's' : ''} selected</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Max 3</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={clear}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}>
            Clear
          </button>
          <button type="button" onClick={() => router.push('/compare')}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: 'var(--crimson)', color: 'white' }}>
            <GitCompare size={13} /> Compare
          </button>
        </div>
      </div>
    </div>
  )
}
