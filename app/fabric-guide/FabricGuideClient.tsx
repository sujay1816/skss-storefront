'use client'
import { useState } from 'react'
import Link from 'next/link'
import { X, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'

interface Fabric {
  id: string; name: string; slug: string; tagline: string
  description: string; care_instructions: string
  occasions: string[]; price_range: string
}

const FABRIC_ICONS: Record<string, string> = {
  kanjivaram: '👑', banarasi: '🕌', chanderi: '✨', tussar: '🌿', organza: '🪽',
  linen: '🌾', georgette: '💫', chiffon: '🌸', cotton: '🌱', 'khadi-silk': '🤝',
  'crepe-silk': '🌊', 'raw-silk': '💎', bandhani: '🎨',
}

export default function FabricGuideClient({ fabrics }: { fabrics: Fabric[] }) {
  const [selected, setSelected] = useState<Fabric | null>(null)

  return (
    <div className="page-container py-8 md:py-12">
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Fabric Guide' }]} />

      <div className="text-center mt-8 mb-12">
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Education</p>
        <h1 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Know Your <em>Silk</em>
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          Every saree tells a story. Understanding the fabric helps you choose the right saree for the right occasion,
          care for it properly, and appreciate the craftsmanship behind it.
        </p>
      </div>

      {fabrics.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-4xl mb-4">🥻</p>
          <p>Fabric guide coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fabrics.map(f => (
            <button key={f.id} type="button"
              onClick={() => setSelected(f)}
              className="group text-left rounded-lg p-5 transition-all hover:-translate-y-1"
              style={{ background: 'white', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(139,26,43,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
              <div className="text-3xl mb-3">{FABRIC_ICONS[f.slug] || '🥻'}</div>
              <h2 className="font-semibold mb-1 text-sm leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{f.name}</h2>
              {f.tagline && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{f.tagline}</p>}
              {f.price_range && <p className="text-xs font-medium" style={{ color: 'var(--crimson)' }}>{f.price_range}</p>}
              {f.occasions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {f.occasions.slice(0, 2).map(o => (
                    <span key={o} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--cream)', color: 'var(--text-secondary)', fontSize: 10 }}>{o}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-3 text-xs font-medium transition-colors group-hover:gap-2" style={{ color: 'var(--crimson)' }}>
                Read more <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Inline CTA */}
      <div className="mt-16 rounded-xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #8B1A2B, #6B1220)' }}>
        <p className="text-white text-xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Ready to find your perfect saree?</p>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>Now that you know the fabrics, let us help you choose.</p>
        <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-medium" style={{ background: 'var(--gold)', color: '#1A1A1A' }}>
          Browse Collection <ChevronRight size={14} />
        </Link>
      </div>

      {/* Fabric Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="w-full sm:max-w-lg max-h-screen sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl"
            style={{ background: 'white' }}>
            {/* Modal header */}
            <div className="sticky top-0 flex items-center justify-between p-5 border-b z-10"
              style={{ background: 'white', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{FABRIC_ICONS[selected.slug] || '🥻'}</span>
                <div>
                  <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{selected.name}</h2>
                  {selected.tagline && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selected.tagline}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {selected.description && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>About</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selected.description}</p>
                </div>
              )}

              {selected.care_instructions && (
                <div className="rounded-lg p-4" style={{ background: 'var(--cream)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Care Instructions</h3>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selected.care_instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selected.occasions?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Best for</h3>
                    <div className="flex flex-wrap gap-1">
                      {selected.occasions.map(o => (
                        <Link key={o} href={`/shop?occasion=${encodeURIComponent(o)}`} onClick={() => setSelected(null)}
                          className="text-xs px-2 py-1 rounded-full border transition-colors"
                          style={{ color: 'var(--crimson)', borderColor: 'var(--crimson)', background: 'var(--cream)' }}>
                          {o}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {selected.price_range && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Price Range</h3>
                    <p className="text-sm font-semibold" style={{ color: 'var(--crimson)' }}>{selected.price_range}</p>
                  </div>
                )}
              </div>

              <Link href={`/shop?fabric=${encodeURIComponent(selected.name)}`}
                onClick={() => setSelected(null)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded text-sm font-medium"
                style={{ background: 'var(--crimson)', color: 'white' }}>
                Shop {selected.name} Sarees <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
