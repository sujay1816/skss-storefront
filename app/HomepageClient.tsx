'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Shield, Truck, RotateCcw, Award, ChevronRight, ChevronLeft, Play, Pause } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import RecentlyViewed from '@/components/product/RecentlyViewed'
import type { SiteConfig, Category, Product, Banner, BannerSlide } from '@/types'

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }

// ── optimise Cloudinary video URL ─────────────────────────────────────────────
const optimiseVideo = (url: string) =>
  url?.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/q_auto,f_auto/')
    : url

// ── VideoSlide — plays one video, loops it, honours pause from parent ─────────
function VideoSlide({ src, poster, objectPosition, onEnded, isPaused }: {
  src: string; poster?: string; objectPosition?: string; onEnded: () => void; isPaused?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const optimised = optimiseVideo(src)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.load()
    const p = v.play()
    if (p) p.catch(() => {})
  }, [optimised])

  // Honour pause/play toggle
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isPaused) { v.pause() } else { v.play().catch(() => {}) }
  }, [isPaused])

  return (
    <video ref={videoRef} autoPlay muted playsInline preload="auto" loop
      poster={poster} onEnded={onEnded}
      className="absolute inset-0 w-full h-full object-cover hero-media"
      style={{ objectPosition: objectPosition || 'center' }}>
      <source src={optimised} />
    </video>
  )
}

// ── HeroSlideshow ──────────────────────────────────────────────────────────────
const DEFAULT_DURATION = 5

function HeroSlideshow({ banner, overlayGradient, textCol, tagline }: {
  banner: Banner
  overlayGradient: string
  textCol: { primary: string; secondary: string; accent: string; border: string }
  tagline: string
}) {
  // Build slides: new card-based format first, then legacy video_urls, then single image
  const slides: BannerSlide[] = (() => {
    if (banner.slides?.length > 0) {
      // Fill in banner.imageUrl as fallback for any slide missing an image
      return banner.slides.map(s => ({
        ...s,
        imageUrl: s.imageUrl || banner.imageUrl || '',
        imageFocus: s.imageFocus || banner.imageFocus || 'center',
      }))
    }
    const legacyUrls = banner.videoUrls?.length > 0 ? banner.videoUrls : banner.videoUrl ? [banner.videoUrl] : []
    if (legacyUrls.length > 0) {
      return legacyUrls.map(url => ({
        mediaType: 'video' as const, videoUrl: url,
        imageUrl: banner.imageUrl, imageFocus: banner.imageFocus,
        heading: banner.heading, headingItalic: banner.headingItalic,
        subheading: banner.subheading || '', badgeText: banner.badgeText,
        ctaLabel: banner.ctaLabel, ctaUrl: banner.ctaUrl,
        ctaSecondaryLabel: banner.ctaSecondaryLabel, ctaSecondaryUrl: banner.ctaSecondaryUrl,
      }))
    }
    return [{
      mediaType: 'image' as const,
      imageUrl: banner.imageUrl, imageFocus: banner.imageFocus,
      heading: banner.heading, headingItalic: banner.headingItalic,
      subheading: banner.subheading || '', badgeText: banner.badgeText,
      ctaLabel: banner.ctaLabel, ctaUrl: banner.ctaUrl,
      ctaSecondaryLabel: banner.ctaSecondaryLabel, ctaSecondaryUrl: banner.ctaSecondaryUrl,
    }]
  })()

  const total = slides.length
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const videoRef2 = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slide = slides[current]
  const isVideo = slide.mediaType === 'video' && !!slide.videoUrl

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }

  const goTo = (idx: number) => { setCurrent(idx); clearTimer() }
  const goNext = useCallback(() => goTo((current + 1) % total), [current, total])
  const goPrev = useCallback(() => goTo((current - 1 + total) % total), [current, total])

  // Image slides: auto-advance after slideDuration seconds (skip when paused)
  useEffect(() => {
    if (isVideo || total <= 1 || isPaused) return
    const ms = ((slide.slideDuration ?? DEFAULT_DURATION)) * 1000
    timerRef.current = setTimeout(goNext, ms)
    return clearTimer
  }, [current, isVideo, total, slide.slideDuration, isPaused])

  return (
    <>
      {/* ── BACKGROUND ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`bg-${current}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}>
            {isVideo ? (
              <VideoSlide
                src={slide.videoUrl!}
                poster={slide.imageUrl || banner.imageUrl || undefined}
                objectPosition={slide.imageFocus || 'center'}
                isPaused={isPaused}
                onEnded={() => { if (total > 1) goNext() }}
              />
            ) : slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.heading || 'Banner'}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slide.imageFocus || 'center' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0D0806,#1A0E0A,#2C1810)' }} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* OPTION A — VIDEO: thin bottom-only gradient so the full video is visible.
            IMAGE: original left-side gradient for text contrast. */}
        {isVideo ? (
          /* Bottom gradient only — covers bottom 40%, max opacity 0.80 */
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(10,5,3,0.82) 0%, rgba(10,5,3,0.55) 28%, rgba(10,5,3,0.15) 50%, transparent 70%)',
          }} />
        ) : (
          /* Original left gradient for image slides — unchanged */
          <div style={{ position: 'absolute', inset: 0, background: overlayGradient, pointerEvents: 'none' }} />
        )}
      </div>

      {/* ── CONTENT ── */}
      {isVideo ? (
        /* OPTION A — VIDEO: content anchored to BOTTOM-LEFT, compact, unobstructed view above */
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          paddingBottom: total > 1 ? '56px' : '32px', pointerEvents: 'none',
        }}>
          <div className="page-container w-full" style={{ pointerEvents: 'auto' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`txt-${current}`}
                className="hero-video-content"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: 'easeOut' }}>

                {/* Badge */}
                {slide.badgeText && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px w-8 flex-shrink-0" style={{ background: textCol.accent }} />
                    <span className="text-xs tracking-widest uppercase" style={{ color: textCol.accent, fontFamily: 'var(--font-body)', fontSize: 10 }}>{slide.badgeText}</span>
                  </div>
                )}

                {/* Compact heading — smaller than image layout to give video maximum room */}
                <h1 className="hero-video-heading font-light" style={{ color: 'white', fontFamily: 'var(--font-heading)', marginBottom: 12 }}>
                  {slide.heading || 'Draped in'}
                  <em style={{ color: 'var(--gold-light)' }}>{slide.headingItalic ? ` ${slide.headingItalic}` : ' Royal Elegance'}</em>
                </h1>

                {/* CTA buttons — horizontal always */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link href={slide.ctaUrl || '/shop'} className="hero-cta-primary" style={{ padding: '10px 20px' }}>
                    {slide.ctaLabel || 'Shop Now'}<ArrowRight size={13} className="flex-shrink-0" />
                  </Link>
                  {slide.ctaSecondaryLabel && (
                    <Link href={slide.ctaSecondaryUrl || '/shop'} className="hero-cta-secondary" style={{ padding: '10px 20px' }}>
                      {slide.ctaSecondaryLabel}
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Original IMAGE layout — vertically centred, full heading + subheading */
        <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <div className="page-container w-full" style={{ pointerEvents: 'auto' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`txt-${current}`} className="max-w-xl hero-content-container"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
                {slide.badgeText && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-10 flex-shrink-0" style={{ background: textCol.accent }} />
                    <span className="text-xs tracking-widest uppercase" style={{ color: textCol.accent, fontFamily: 'var(--font-body)' }}>{slide.badgeText}</span>
                  </div>
                )}
                <h1 className="hero-heading font-light mb-4" style={{ color: textCol.primary, fontFamily: 'var(--font-heading)' }}>
                  {slide.heading || 'Draped in'}
                  <em style={{ color: textCol.accent }}>{slide.headingItalic || ' Royal Elegance'}</em>
                </h1>
                {slide.subheading && (
                  <p className="text-sm font-light mb-2 max-w-sm hero-subtext" style={{ color: textCol.secondary, lineHeight: 1.7 }}>{slide.subheading}</p>
                )}
                {tagline && (
                  <p className="text-xs mb-6 tracking-widest hero-tagline" style={{ color: textCol.accent, fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>&quot;{tagline}&quot;</p>
                )}
                <div className="hero-cta-group">
                  <Link href={slide.ctaUrl || '/shop'} className="hero-cta-primary">
                    {slide.ctaLabel || 'Shop Now'}<ArrowRight size={13} className="flex-shrink-0" />
                  </Link>
                  {slide.ctaSecondaryLabel && (
                    <Link href={slide.ctaSecondaryUrl || '/shop'} className="hero-cta-secondary">{slide.ctaSecondaryLabel}</Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      {/* Pause/play button — always shown on video slides (single or multi) */}
      {isVideo && (
        <button
          type="button"
          onClick={() => setIsPaused(p => !p)}
          aria-label={isPaused ? 'Play video' : 'Pause video'}
          className="absolute z-20 flex items-center justify-center rounded-full transition-opacity"
          style={{
            bottom: total > 1 ? 56 : 20,
            right: 16,
            width: 36, height: 36,
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: 'white',
          }}>
          {isPaused ? <Play size={14} fill="white" /> : <Pause size={14} />}
        </button>
      )}

      {total > 1 && (
        <>
          <button type="button" onClick={goPrev} aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.35)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={goNext} aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.35)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => goTo(i)} className="rounded-full transition-all"
                style={{ width: i === current ? 24 : 8, height: 8, background: i === current ? 'var(--gold-light)' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 z-20" style={{ background: 'rgba(255,255,255,0.1)' }}>
            {isVideo
              ? <div className="h-full opacity-40" style={{ width: '100%', background: 'var(--gold-light)' }} />
              : <motion.div key={`pb-${current}`} className="h-full" style={{ background: 'var(--gold-light)' }}
                  initial={{ width: '0%' }} animate={{ width: '100%' }}
                  transition={{ duration: slide.slideDuration ?? DEFAULT_DURATION, ease: 'linear' }} />
            }
          </div>
        </>
      )}
    </>
  )
}

export default function HomepageClient({ config, categories, featured, bestsellers, newArrivals, banners, occasions = [], userId }: {
  config: SiteConfig; categories: Category[]; featured: Product[]; bestsellers: Product[]; newArrivals: Product[]; banners: Banner[]; occasions?: any[]; userId?: string
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroBanner = banners[0]

  const overlayMap: Record<string, string> = {
    dark:  'linear-gradient(105deg, rgba(13,8,6,0.92) 0%, rgba(13,8,6,0.7) 50%, rgba(13,8,6,0.3) 100%)',
    light: 'linear-gradient(105deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
    none:  'none',
    left:  'linear-gradient(to right, rgba(13,8,6,0.92) 0%, rgba(13,8,6,0.5) 50%, transparent 100%)',
    right: 'linear-gradient(to left, rgba(13,8,6,0.92) 0%, rgba(13,8,6,0.5) 50%, transparent 100%)',
  }
  const overlayGradient = overlayMap[heroBanner?.overlayStyle || 'dark'] || overlayMap.dark

  const textColMap: Record<string, { primary: string; secondary: string; accent: string; border: string }> = {
    white: { primary: 'white', secondary: 'rgba(255,255,255,0.7)', accent: 'var(--gold-light)', border: 'rgba(201,168,76,0.4)' },
    gold:  { primary: 'var(--gold-light)', secondary: 'rgba(201,168,76,0.8)', accent: 'white', border: 'rgba(255,255,255,0.4)' },
    dark:  { primary: '#1A0E0A', secondary: 'rgba(26,14,10,0.7)', accent: 'var(--crimson)', border: 'rgba(26,14,10,0.3)' },
  }
  const textCol = textColMap[heroBanner?.textColor || 'white'] || textColMap.white

  return (
    <>
      {/* ── HERO ── */}
      <section ref={heroRef} className="hero-section">
        {heroBanner ? (
          <HeroSlideshow
            banner={heroBanner}
            overlayGradient={overlayGradient}
            textCol={textCol}
            tagline={config.brand_tagline || ''}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0D0806 0%, #1A0E0A 30%, #2C1810 60%, #1A0E0A 100%)' }} />
        )}
      </section>

      {/* ── MARQUEE ── */}
      <div className="overflow-hidden py-3 relative" style={{ background: 'var(--crimson-dark)', borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
        <div className="marquee-track">
          {[0, 1].map(copy => (
            <span key={copy} className="marquee-item text-xs tracking-widest uppercase font-medium px-6" style={{ color: 'var(--gold-light)' }}>
              ✦ Pure Silk Sarees &nbsp;&nbsp;✦ Handloom Weaves &nbsp;&nbsp;✦ Kanjivaram &nbsp;&nbsp;✦ Banarasi &nbsp;&nbsp;✦ Free Shipping Above ₹{Number(config.free_shipping_above || 1999).toLocaleString('en-IN')} &nbsp;&nbsp;✦ Authentic Craftsmanship &nbsp;&nbsp;✦ {config.return_window_days || 7}-Day Easy Returns &nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── HONEST TRUST STRIP — only facts that are always true ── */}
      <div style={{ background: 'var(--ivory)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-3">
          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-1">
            {[
              { icon: '🤝', text: 'Cash on Delivery available' },
              { icon: '🔒', text: '100% secure payments' },
              { icon: '↩️', text: `${config.return_window_days || 7}-day easy returns` },
              { icon: '✅', text: 'Pure silk, certified authentic' },
              { icon: '📦', text: `Free shipping above ₹${Number(config.free_shipping_above || 1999).toLocaleString('en-IN')}` },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-center gap-1.5">
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {item.text}
                </span>
                {i < arr.length - 1 && (
                  <span className="hidden sm:inline text-xs ml-1" style={{ color: 'var(--border)' }}>·</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRUST BADGES ── */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Truck size={22} />, title: 'Free Shipping', sub: `On orders above ₹${Number(config.free_shipping_above || 1999).toLocaleString('en-IN')}` },
              { icon: <RotateCcw size={22} />, title: `${config.return_window_days || 7}-Day Returns`, sub: 'Hassle-free returns' },
              { icon: <Shield size={22} />, title: '100% Authentic', sub: 'Pure silk, certified' },
              { icon: <Award size={22} />, title: 'Legacy Brand', sub: 'Trusted for generations' },
            ].map((b, i) => (
              <div key={i}
                className="flex items-center gap-3 p-3 md:p-4 rounded-lg transition-all cursor-default trust-badge-card"
                style={{ border: '1px solid var(--border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.background = 'var(--cream)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'white' }}>
                <div className="w-11 h-11 flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: 'var(--cream)', color: 'var(--crimson)' }}>{b.icon}</div>
                <div>
                  <p className="text-sm font-semibold trust-badge-text" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                  <p className="text-xs mt-0.5 trust-badge-sub" style={{ color: 'var(--text-secondary)' }}>{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHOP BY OCCASION — shown only when admin has configured occasions ── */}
      {occasions.length > 0 && (
        <section style={{ background: 'white', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
          <div className="page-container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Curated Collections</p>
              <h2 className="section-heading">Shop by Occasion</h2>
              <div className="w-16 h-px mx-auto mt-4" style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {occasions.map((occ: any) => (
                <motion.div key={occ.id} variants={fadeUp}>
                  <a href={`/shop?occasion=${encodeURIComponent(occ.slug)}`} className="group block">
                    <div className="relative overflow-hidden rounded-xl mb-2"
                      style={{ aspectRatio: '3/4', background: 'var(--cream)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                      {occ.image_url ? (
                        <>
                          <div className="absolute inset-0 skeleton" />
                          <Image src={occ.image_url} alt={occ.name} fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover transition-all duration-700 group-hover:scale-110"
                            style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
                            onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }} />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">🥻</span></div>
                      )}
                      <div className="absolute inset-0 transition-all duration-300 group-hover:bg-black/10"
                        style={{ background: 'linear-gradient(to top, rgba(139,26,43,0.65) 0%, transparent 55%)' }} />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs font-semibold tracking-wide uppercase text-white text-center"
                          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{occ.name}</p>
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES ── */}
      <section style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', background: 'var(--ivory)' }}>
        <div className="page-container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Browse By</p>
            <h2 className="section-heading">Shop Collections</h2>
            <div className="w-16 h-px mx-auto mt-4" style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="category-grid-3col">
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Link href={`/shop/${cat.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-lg mb-3 transition-all"
                    style={{ aspectRatio: '2/3', background: 'var(--cream)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    {cat.imageUrl ? (
                      <>
                        <div className="absolute inset-0 skeleton" />
                        <Image src={cat.imageUrl} alt={cat.name} fill
                          sizes="(max-width: 640px) 50vw, 33vw" quality={75}
                          className="object-cover transition-all duration-700 group-hover:scale-110"
                          style={{ opacity: 0, transition: 'opacity 0.4s ease' }}
                          onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = '1' }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)' }}>
                        <span className="text-5xl mb-2">🥻</span>
                      </div>
                    )}
                    <div className="absolute inset-0 transition-all duration-300 group-hover:bg-black/20"
                      style={{ background: 'linear-gradient(to top, rgba(26,26,26,0.5) 0%, transparent 60%)' }} />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs font-semibold tracking-wide uppercase text-white text-center"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{cat.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-center font-medium tracking-wide transition-colors"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
                    {cat.name} <ChevronRight size={11} className="inline" />
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="py-10 md:py-16" style={{ background: 'white' }}>
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Just Arrived</p>
                <h2 className="section-heading">New Arrivals</h2>
              </div>
              <Link href="/shop?filter=new" className="group hidden md:flex items-center gap-2 text-xs tracking-widest uppercase font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
                View All <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 'var(--space-4)' }}>
              {newArrivals.map((p, i) => <ProductCard key={p.id} product={p} userId={userId} index={i} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/shop?filter=new" className="btn-outline">View All New Arrivals <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BRAND STATEMENT ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="text-center relative overflow-hidden" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)', background: 'linear-gradient(135deg, #0D0806 0%, #1A0E0A 40%, var(--crimson-dark) 70%, #1A0E0A 100%)' }}>
        <div className="page-container relative z-10">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, var(--gold))' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Our Promise</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, var(--gold))' }} />
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-light text-white mb-4"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 5vw, 64px)', lineHeight: 1.2 }}>
            Every saree tells a story.<br />
            <em style={{ color: 'var(--gold-light)' }}>Yours starts here.</em>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm max-w-lg mx-auto mb-10"
            style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
            Handpicked from the finest looms across India — Kanjivaram, Banarasi, Chanderi and more.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/shop" className="group inline-flex items-center gap-3 px-10 py-4 text-xs font-medium tracking-widest uppercase transition-all"
              style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)', color: 'white', boxShadow: '0 4px 24px rgba(201,168,76,0.4)' }}>
              Explore Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* ── BESTSELLERS ── */}
      {bestsellers.length > 0 && (
        <section className="py-10 md:py-16" style={{ background: 'var(--ivory)' }}>
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Most Loved</p>
                <h2 className="section-heading">Bestsellers</h2>
              </div>
              <Link href="/shop?filter=bestsellers" className="group hidden md:flex items-center gap-2 text-xs tracking-widest uppercase font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
                View All <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestsellers.map((p, i) => <ProductCard key={p.id} product={p} userId={userId} index={i} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/shop?filter=bestsellers" className="btn-outline">View All Bestsellers <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED ── */}
      {featured.length > 0 && (
        <section className="py-10 md:py-16" style={{ background: 'white' }}>
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Curated</p>
                <h2 className="section-heading">Featured Collection</h2>
              </div>
              <Link href="/shop?filter=featured" className="group hidden md:flex items-center gap-2 text-xs tracking-widest uppercase font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
                View All <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p, i) => <ProductCard key={p.id} product={p} userId={userId} index={i} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/shop?filter=featured" className="btn-outline">View All Featured <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ── RECENTLY VIEWED — personalised, hidden when empty ── */}
      <RecentlyViewed />

      {/* ── ABOUT STRIP ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="border-t" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', borderColor: 'var(--border)', background: 'var(--ivory)' }}>
        <div className="page-container">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/3 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 border opacity-20 rotate-3" style={{ borderColor: 'var(--gold)' }} />
                <div className="absolute -inset-4 border opacity-10 -rotate-3" style={{ borderColor: 'var(--crimson)' }} />
                <Image src={config.logo_url || ''} alt={config.brand_name || ''} width={140} height={140} className="object-contain relative z-10 md:w-[200px] md:h-[200px]" />
              </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Our Story</p>
              <h2 className="section-heading mb-4">A Legacy of Silk & Tradition</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                {config.brand_name || 'Our brand'} is a celebration of India's finest weaving traditions. We bring you an exquisite collection of pure silk and traditional sarees, each handpicked to ensure unmatched quality and authenticity.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                From the golden looms of Kanjivaram to the royal grandeur of Banarasi — every saree in our collection carries the spirit of timeless elegance.
              </p>
              <Link href="/about" className="btn-outline">Our Story <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  )
}
