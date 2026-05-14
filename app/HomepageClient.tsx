'use client'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Shield, Truck, RotateCcw, Award, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { SiteConfig, Category, Product, Banner } from '@/types'

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }

export default function HomepageClient({ config, categories, featured, bestsellers, newArrivals, banners, userId }: {
  config: SiteConfig; categories: Category[]; featured: Product[]; bestsellers: Product[]; newArrivals: Product[]; banners: Banner[]; userId?: string
}) {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroBanner = banners[0]

  // Compute overlay gradient based on admin setting
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
      <section ref={heroRef} className="hero-section relative overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          {heroBanner?.videoUrl ? (
            /* Background video — muted, autoplay, lazy loaded for performance */
            <video
              key={heroBanner.videoUrl}
              className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: heroBanner.imageFocus || 'center' }}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster={heroBanner.imageUrl || undefined}
            >
              <source src={heroBanner.videoUrl} type="video/mp4" />
              {/* Fallback to image if video fails */}
              {heroBanner.imageUrl && (
                <img src={heroBanner.imageUrl} alt="Hero" className="w-full h-full" style={{ objectFit: 'cover' }} />
              )}
            </video>
          ) : heroBanner?.imageUrl ? (
            /* FIX: Next.js Image — LCP priority, WebP/AVIF, correct size per device */
            <Image
              src={heroBanner.imageUrl}
              alt={heroBanner.heading || 'Hero banner'}
              fill
              priority
              quality={85}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: heroBanner.imageFocus || 'center' }}
            />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0D0806 0%, #1A0E0A 30%, #2C1810 60%, #1A0E0A 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Image src={config.logo_url || '/images/logo.png'} alt="" width={120} height={120} className="object-contain" loading="lazy" />
              </div>
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(201,168,76,0.03) 60px, rgba(201,168,76,0.03) 61px)', backgroundSize: '120px 120px' }} />
            </div>
          )}
          {/* Dynamic overlay */}
          <div className="absolute inset-0" style={{ background: overlayGradient }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to top, rgba(253,250,247,0.15), transparent)' }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 h-full flex items-center">
          <div className="page-container">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl">

              {/* Badge text */}
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <div className="h-px w-12" style={{ background: textCol.accent }} />
                <span className="text-xs tracking-widest uppercase" style={{ color: textCol.accent, fontFamily: 'var(--font-body)' }}>
                  {heroBanner?.badgeText || 'New Collection 2025'}
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1 variants={fadeUp} className="font-light leading-none mb-6"
                style={{ color: textCol.primary, fontFamily: 'var(--font-heading)', fontSize: 'var(--text-display)', letterSpacing: '-0.01em' }}>
                {heroBanner?.heading || 'Draped in'}
                {heroBanner?.headingItalic ? (
                  <><br /><em style={{ color: textCol.accent }}>{heroBanner.headingItalic}</em></>
                ) : (
                  <><br /><em style={{ color: 'var(--gold-light)' }}>Royal Elegance</em></>
                )}
              </motion.h1>

              {/* Subheading */}
              <motion.p variants={fadeUp} className="text-base font-light mb-3 max-w-lg hero-subtext"
                style={{ color: textCol.secondary, fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
                {heroBanner?.subheading || 'Discover timeless silk sarees crafted for the modern woman. Each piece a masterpiece of Indian heritage.'}
              </motion.p>

              <motion.p variants={fadeUp} className="text-sm mb-10 tracking-widest hero-tagline"
                style={{ color: textCol.accent, fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>
                "{config.brand_tagline}"
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 hero-cta-group">
                <Link href={heroBanner?.ctaUrl || '/shop'}
                  className="group flex items-center justify-center gap-3 px-6 py-4 text-xs font-medium tracking-widest uppercase text-white transition-all w-full sm:w-auto"
                  style={{ background: 'linear-gradient(135deg, var(--crimson) 0%, var(--crimson-dark) 100%)', boxShadow: '0 4px 24px rgba(139,26,43,0.5)' }}>
                  {heroBanner?.ctaLabel || 'Shop Now'}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                {/* Secondary CTA — from admin or fallback to New Arrivals */}
                <Link href={heroBanner?.ctaSecondaryUrl || '/shop?filter=new'}
                  className="flex items-center justify-center gap-3 px-6 py-4 text-xs font-medium tracking-widest uppercase transition-all flex-1 sm:flex-none"
                  style={{ border: `1px solid ${textCol.border}`, color: textCol.secondary }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = textCol.accent; (e.currentTarget as HTMLElement).style.color = textCol.primary }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = textCol.border; (e.currentTarget as HTMLElement).style.color = textCol.secondary }}>
                  {heroBanner?.ctaSecondaryLabel || 'New Arrivals'}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

    


      </section>

      {/* ── MARQUEE ── */}
      {/* FIX: CSS marquee — no Framer Motion, only 2 copies needed for seamless loop */}
      <div className="overflow-hidden py-3 relative" style={{ background: 'var(--crimson-dark)', borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
        <div className="marquee-track">
          {[0, 1].map(copy => (
            <span key={copy} className="marquee-item text-xs tracking-widest uppercase font-medium px-6" style={{ color: 'var(--gold-light)' }}>
              ✦ Pure Silk Sarees &nbsp;&nbsp;✦ Handloom Weaves &nbsp;&nbsp;✦ Kanjivaram &nbsp;&nbsp;✦ Banarasi &nbsp;&nbsp;✦ Free Shipping Above ₹{Number(config.free_shipping_above || 1999).toLocaleString('en-IN')} &nbsp;&nbsp;✦ Authentic Craftsmanship &nbsp;&nbsp;✦ {config.return_window_days || 7}-Day Easy Returns &nbsp;&nbsp;
            </span>
          ))}
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

      {/* ── CATEGORIES ── */}
      <section style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)", background: "var(--ivory)" }}>
        <div className="page-container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Browse By</p>
            <h2 className="section-heading">Shop Collections</h2>
            <div className="w-16 h-px mx-auto mt-4" style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="category-grid-3col">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Link href={`/shop?category=${cat.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-lg mb-3 transition-all"
                    style={{ aspectRatio: '2/3', background: 'var(--cream)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    {cat.imageUrl ? (
                      <Image src={cat.imageUrl} alt={cat.name} fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      quality={75}
                      className="object-cover transition-transform duration-700 group-hover:scale-110" />
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
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold transition-all rounded-lg"
                      style={{ '--tw-border-opacity': 1 } as any} />
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
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: "var(--space-4)" }}>
              {newArrivals.map(p => <ProductCard key={p.id} product={p} userId={userId} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/shop?filter=new" className="btn-outline">View All New Arrivals <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BRAND STATEMENT BANNER ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="text-center relative overflow-hidden" style={{ paddingTop: "var(--space-16)", paddingBottom: "var(--space-16)", background: 'linear-gradient(135deg, #0D0806 0%, #1A0E0A 40%, var(--crimson-dark) 70%, #1A0E0A 100%)' }}>
        <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none">
          <Image src={config.logo_url || '/images/logo.png'} alt="" width={120} height={120} className="object-contain" loading="lazy" />
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,26,43,0.15) 0%, transparent 50%)' }} />
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
            Handpicked from the finest looms across India — Kanjivaram, Banarasi, Chanderi and more. Each piece a masterpiece of centuries-old craftsmanship.
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
              {bestsellers.map(p => <ProductCard key={p.id} product={p} userId={userId} />)}
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
              {featured.map(p => <ProductCard key={p.id} product={p} userId={userId} />)}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/shop?filter=featured" className="btn-outline">View All Featured <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT STRIP ── */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="border-t" style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)", borderColor: "var(--border)", background: "var(--ivory)" }}>
        <div className="page-container">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/3 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 border opacity-20 rotate-3" style={{ borderColor: 'var(--gold)' }} />
                <div className="absolute -inset-4 border opacity-10 -rotate-3" style={{ borderColor: 'var(--crimson)' }} />
                <Image src={config.logo_url || '/images/logo.png'} alt={config.brand_name || ''} width={140} height={140} className="object-contain relative z-10 md:w-[200px] md:h-[200px]" />
              </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Our Story</p>
              <h2 className="section-heading mb-4">A Legacy of Silk & Tradition</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                {config.brand_name || 'Our brand'} is a celebration of India's finest weaving traditions. We bring you an exquisite collection of pure silk and traditional sarees, each handpicked to ensure unmatched quality and authenticity.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                From the golden looms of Kanjivaram to the royal grandeur of Banarasi — every saree in our collection carries the spirit of timeless elegance. Whether you're dressing for a wedding, festival or everyday grace — find the saree that tells your story.
              </p>
              <Link href="/about" className="btn-outline">Our Story <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  )
}
