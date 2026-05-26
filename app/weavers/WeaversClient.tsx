'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'

interface Weaver {
  id: string; name: string; region: string; craft: string
  story: string; image_url: string; years_crafting: number
}

export default function WeaversClient({ weavers }: { weavers: Weaver[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="page-container py-8 md:py-12">
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Our Weavers' }]} />

      <div className="text-center mt-8 mb-12">
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>The People Behind the Craft</p>
        <h1 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Our <em>Weavers</em>
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          Every saree we carry is the product of years of mastery, passed down through generations.
          These are the artisans who give life to the threads.
        </p>
      </div>

      {weavers.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-4xl mb-4">🧵</p>
          <p>Weaver stories coming soon.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weavers.map(w => {
            const expanded = expandedId === w.id
            return (
              <div key={w.id} className="rounded-xl overflow-hidden transition-all"
                style={{ background: 'white', border: '1px solid var(--border)', boxShadow: expanded ? '0 8px 32px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                {/* Photo */}
                <div className="relative" style={{ aspectRatio: '4/3', background: 'var(--cream)' }}>
                  {w.image_url ? (
                    <Image src={w.image_url} alt={w.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">🧵</span>
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{w.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={11} className="text-white opacity-70" />
                      <p className="text-xs text-white opacity-80">{w.region}</p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-wrap gap-2">
                      {w.craft && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--crimson)', border: '1px solid var(--crimson)' }}>{w.craft}</span>}
                      {w.years_crafting > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--cream)', color: 'var(--text-secondary)' }}>{w.years_crafting} years</span>}
                    </div>
                  </div>

                  {w.story && (
                    <>
                      <p className={`text-sm leading-relaxed transition-all ${expanded ? '' : 'line-clamp-3'}`}
                        style={{ color: 'var(--text-primary)' }}>
                        {w.story}
                      </p>
                      {w.story.length > 160 && (
                        <button type="button"
                          onClick={() => setExpandedId(expanded ? null : w.id)}
                          className="flex items-center gap-1 mt-2 text-xs font-medium transition-colors"
                          style={{ color: 'var(--crimson)' }}>
                          {expanded ? <><ChevronUp size={12} /> Read less</> : <><ChevronDown size={12} /> Read more</>}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
