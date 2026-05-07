'use client'
import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Star, Shield, Truck, RotateCcw, Award } from 'lucide-react'
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

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ height: '92vh', minHeight: 600 }}>
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          {heroBanner?.imageUrl ? (
            <Image src={heroBanner.imageUrl} alt="Hero" fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2C1810 50%, #3D1A1A 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Image src="/images/logo.png" alt="" width={400} height={400} className="object-contain" />
              </div>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26,26,26,0.85) 0%, rgba(26,26,26,0.5) 60%, rgba(26,26,26,0.2) 100%)' }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 h-full flex items-center">
          <div className="page-container">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-2xl">
              <motion.p variants={fadeUp} className="text-xs tracking-widest uppercase mb-4 flex items-center gap-2" style={{ color: 'var(--gold-light)' }}>
                <span className="w-8 h-px inline-block" style={{ background: 'var(--gold)' }} /> New Collection 2025
              </motion.p>
              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-light text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                {heroBanner?.heading || 'Draped in Royal Elegance'}
              </motion.h1>
              <motion.p variants={fadeUp} className="text-base font-light mb-3" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}>
                {heroBanner?.subheading || 'Discover timeless silk sarees crafted for the modern woman'}
              </motion.p>
              <motion.p variants={fadeUp} className="text-sm mb-8 tracking-widest" style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>
                "{config.brand_tagline}"
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <Link href="/shop" className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--crimson) 0%, var(--crimson-dark) 100%)' }}>
                  {heroBanner?.ctaLabel || 'Shop Now'} <ArrowRight size={14} />
                </Link>
                <Link href="/shop?filter=new" className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
                  New Arrivals
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <span className="text-xs tracking-widest uppercase text-white/40">Scroll</span>
          <div className="w-px h-8 bg-white/20" />
        </motion.div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-y" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
        <div className="page-container py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Truck size={18} />, title: 'Free Shipping', sub: `On orders above ₹${Number(config.free_shipping_above).toLocaleString('en-IN')}` },
              { icon: <RotateCcw size={18} />, title: `${config.return_window_days}-Day Returns`, sub: 'For unused & damaged goods' },
              { icon: <Shield size={18} />, title: '100% Authentic', sub: 'Pure silk guaranteed' },
              { icon: <Award size={18} />, title: 'Legacy Brand', sub: 'Trusted by generations' },
            ].map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--crimson)' }}>{b.icon}</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY STRIP */}
      <section className="border-b py-8" style={{ borderColor: 'var(--border)', background: 'white' }}>
        <div className="page-container">
          <div className="flex overflow-x-auto gap-4 pb-2">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex-shrink-0">
                <Link href={`/shop?category=${cat.slug}`}
                  className="flex flex-col items-center gap-3 px-6 py-4 border-b-2 border-transparent transition-all duration-200 hover:border-crimson group"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--crimson)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                    {cat.imageUrl ? <Image src={cat.imageUrl} alt={cat.name} width={40} height={40} className="object-cover rounded-full" /> : <span className="text-2xl">🥻</span>}
                  </div>
                  <span className="text-xs font-medium tracking-wide whitespace-nowrap" style={{ fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="py-16">
          <div className="page-container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Just Arrived</p>
                <h2 className="section-heading">New Arrivals</h2>
              </div>
              <Link href="/shop?filter=new" className="hidden md:flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                View All <ArrowRight size={14} />
              </Link>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map(p => <motion.div key={p.id} variants={fadeUp}><ProductCard product={p} userId={userId} /></motion.div>)}
            </motion.div>
          </div>
        </section>
      )}

      {/* BRAND STATEMENT */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="py-20 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--crimson-dark) 0%, var(--crimson) 50%, #6B1220 100%)' }}>
        <div className="absolute inset-0 opacity-5 flex items-center justify-center">
          <Image src="/images/logo.png" alt="" width={600} height={600} className="object-contain" />
        </div>
        <div className="page-container relative z-10">
          <div className="gold-divider mb-8"><span className="text-xs tracking-widest uppercase text-white/60">Our Promise</span></div>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Every saree tells a story.<br />
            <em style={{ color: 'var(--gold-light)' }}>Yours starts here.</em>
          </h2>
          <p className="text-sm text-white/70 mb-8 max-w-lg mx-auto">Handpicked from the finest looms across India — Kanjivaram, Banarasi, Chanderi and more. Each piece a masterpiece.</p>
          <Link href="/shop" className="btn-gold">Explore Collection <ArrowRight size={14} /></Link>
        </div>
      </motion.section>

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
        <section className="py-16" style={{ background: 'var(--ivory)' }}>
          <div className="page-container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Most Loved</p>
                <h2 className="section-heading">Bestsellers</h2>
              </div>
              <Link href="/shop?filter=bestsellers" className="hidden md:flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>View All <ArrowRight size={14} /></Link>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestsellers.map(p => <motion.div key={p.id} variants={fadeUp}><ProductCard product={p} userId={userId} /></motion.div>)}
            </motion.div>
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="py-16" style={{ background: 'white' }}>
          <div className="page-container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Curated</p>
                <h2 className="section-heading">Featured Collection</h2>
              </div>
              <Link href="/shop?filter=featured" className="hidden md:flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>View All <ArrowRight size={14} /></Link>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map(p => <motion.div key={p.id} variants={fadeUp}><ProductCard product={p} userId={userId} /></motion.div>)}
            </motion.div>
          </div>
        </section>
      )}

      {/* ABOUT STRIP */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="py-16 border-t" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
        <div className="page-container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/3 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 border opacity-20" style={{ borderColor: 'var(--gold)' }} />
                <Image src={config.logo_url || "/images/logo.png"} alt={config.brand_name || "Sai Krishna Silks and Sarees"} width={200} height={200} className="object-contain relative z-10" />
              </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Our Story</p>
              <h2 className="section-heading mb-4">A Legacy of Silk & Tradition</h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                {config.brand_name || 'Sai Krishna Silks and Sarees'} is a celebration of India's finest weaving traditions. We bring you an exquisite collection of pure silk and traditional sarees, each handpicked to ensure unmatched quality and authenticity. From the golden looms of Kanjivaram to the royal grandeur of Banarasi, every saree in our collection carries the spirit of timeless elegance.
              </p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                Whether you're dressing for a wedding, festival or everyday grace — find the saree that tells your story.
              </p>
              <Link href="/about" className="btn-outline">Our Story <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  )
}
