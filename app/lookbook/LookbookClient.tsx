'use client'
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'

interface Photo { id: string; title: string; description: string; image_url: string }

// 3D tilt card — follows mouse, creates holographic depth effect
function TiltCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width  - 0.5   // -0.5 to 0.5
      const y = (e.clientY - rect.top)  / rect.height - 0.5
      const tiltX = y * -14   // tilt up to 14deg
      const tiltY = x *  14
      const shine = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.18) 0%, transparent 60%)`
      card.style.transform = `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.03)`
      card.style.boxShadow = `${-tiltY * 2}px ${tiltX * 2}px 32px rgba(139,26,43,0.18), 0 8px 24px rgba(0,0,0,0.12)`
      const shineEl = card.querySelector('.tilt-shine') as HTMLElement
      if (shineEl) shineEl.style.background = shine
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    cancelAnimationFrame(rafRef.current)
    card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)'
    card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
    const shineEl = card.querySelector('.tilt-shine') as HTMLElement
    if (shineEl) shineEl.style.background = 'transparent'
  }, [])

  return (
    <div ref={cardRef} role="button" tabIndex={0} aria-label={photo.title || 'Lookbook photo'}
      className="relative overflow-hidden rounded-xl cursor-pointer"
      style={{ aspectRatio: '2/3', background: 'var(--cream)', transition: 'transform 0.15s ease, box-shadow 0.15s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', willChange: 'transform' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <Image src={photo.image_url} alt={photo.title || 'Lookbook'} fill
        className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
      {/* Holographic shine overlay */}
      <div className="tilt-shine absolute inset-0 pointer-events-none transition-all duration-75" style={{ mixBlendMode: 'overlay' }} />
      {/* Bottom gradient + text */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(26,26,26,0.7) 0%, transparent 50%)' }}>
        {(photo.title || photo.description) && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {photo.title && <p className="text-white text-sm font-semibold">{photo.title}</p>}
            {photo.description && <p className="text-white text-xs opacity-80 mt-0.5 line-clamp-2">{photo.description}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LookbookClient({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  return (
    <div className="page-container py-8 md:py-12">
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Lookbook' }]} />

      <div className="text-center mt-8 mb-12">
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Styled Stories</p>
        <h1 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          The <em>Lookbook</em>
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          Sarees styled for real occasions — weddings, festivals, celebrations, and everyday moments of grace.
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-4xl mb-4">📸</p>
          <p className="font-medium mb-1">Lookbook coming soon</p>
          <p className="text-sm">Our styled photos will be here shortly.</p>
        </div>
      ) : (
        <>
          {/* Masonry-style grid — 3D tilt on each card */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
            {photos.map((p, i) => (
              <div key={p.id} className="break-inside-avoid mb-4"
                style={{ animationDelay: `${i * 60}ms` }}>
                <TiltCard photo={p} onClick={() => setLightbox(p)} />
              </div>
            ))}
          </div>

          {/* Parallax scroll hint */}
          <p className="text-center text-xs mt-8" style={{ color: 'var(--text-secondary)' }}>
            Hover over each photo for a 3D effect · Click to view full size
          </p>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setLightbox(null) }}>
          <button type="button" onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full z-10"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            aria-label="Close lightbox">
            <X size={20} />
          </button>
          <div className="relative max-w-lg w-full" style={{ maxHeight: '90vh' }}>
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
              <Image src={lightbox.image_url} alt={lightbox.title || 'Lookbook'} fill className="object-cover" sizes="90vw" />
            </div>
            {(lightbox.title || lightbox.description) && (
              <div className="mt-4 text-center">
                {lightbox.title && <p className="text-white font-semibold">{lightbox.title}</p>}
                {lightbox.description && <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{lightbox.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
