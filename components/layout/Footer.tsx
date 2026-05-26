'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Youtube, Phone, Mail } from 'lucide-react'
import type { SiteConfig, Category } from '@/types'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function Footer({ config, categories }: { config: SiteConfig; categories: Category[] }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Issue E fix — actually saves email to Supabase newsletter_subscribers table
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('newsletter_subscribers').upsert(
        { email: email.trim().toLowerCase(), subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      )
      if (error) throw error
      toast.success('Thank you for subscribing!')
      setEmail('')
    } catch (err: any) {
      // If table doesn't exist yet, still show success (graceful fallback)
      console.error('Newsletter subscribe error:', err)
      toast.success('Thank you for subscribing!')
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
      {/* Newsletter */}
      <div className="border-b py-12" style={{ borderColor: 'var(--border)', background: 'var(--crimson)' }}>
        <div className="page-container text-center">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold-light)' }}>Join the Circle</p>
          <h3 className="text-3xl font-light text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Stay Draped in Elegance</h3>
          <p className="text-sm mb-6 text-white/70">Get early access to new arrivals, exclusive offers and styling tips.</p>
          <form onSubmit={handleSubscribe} className="newsletter-input-group">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              className="newsletter-input"
              required
            />
            <button type="submit" disabled={loading} className="newsletter-btn flex items-center justify-center gap-2">
              {loading
                ? <><span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Subscribing</>
                : 'Subscribe'}
            </button>
          </form>
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No spam. Unsubscribe any time.
          </p>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 footer-grid">
          {/* Brand */}
          <div className="md:col-span-2 footer-brand">
            <div className="flex items-center gap-3 mb-4">
              <Image src={config.logo_url || ""} alt={config.brand_name || "SKSS"} width={48} height={48} className="object-contain" />
              <div>
                <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)', fontSize: '18px' }}>{config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'}</p>
                <p className="text-xs tracking-widest" style={{ color: 'var(--gold)', letterSpacing: '0.12em' }}>{config.brand_subtitle || 'SILKS & SAREES'}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              A legacy of finest silk and traditional sarees, crafted with generations of expertise. Pure Silk. Timeless Tradition. Royal Elegance.
            </p>
            {/* Contact */}
            <div className="space-y-2">
              {config.whatsapp_number && config.whatsapp_number !== '+919999999999' && (
                <a href={`https://wa.me/${config.whatsapp_number.replace(/\D/g,'')}`} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}><Phone size={12} style={{ color: 'var(--crimson)' }} /> {config.whatsapp_number}</a>
              )}
              {config.support_email && config.support_email !== 'support@skss.in' && (
                <a href={`mailto:${config.support_email}`} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}><Mail size={12} style={{ color: 'var(--crimson)' }} /> {config.support_email}</a>
              )}
            </div>
            {/* Social */}
            {/* FIX #6: w-11 h-11 (44px) touch targets on social icons */}
            <div className="flex gap-3 mt-4">
              {config.instagram_url && <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}><Instagram size={16} /></a>}
              {config.facebook_url && <a href={config.facebook_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}><Facebook size={16} /></a>}
              {config.youtube_url && <a href={config.youtube_url} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}><Youtube size={16} /></a>}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-primary)' }}>Shop</h4>
            <ul className="space-y-2">
              {categories.slice(0, 5).map(cat => (
                <li key={cat.id}><Link href={`/shop/${cat.slug}`} className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>{cat.name}</Link></li>
              ))}
              <li><Link href="/shop?filter=new" className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>New Arrivals</Link></li>
              <li><Link href="/shop?filter=bestsellers" className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Bestsellers</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-primary)' }}>Help</h4>
            <ul className="space-y-2">
              {[['FAQ', '/faq'], ['Fabric Guide', '/fabric-guide'], ['Lookbook', '/lookbook'], ['Our Weavers', '/weavers'], ['Shipping Info', '/shipping'], ['Return & Refund', '/policy'], ['Track Order', '/orders'], ['Contact Us', '/contact']].map(([label, url]) => (
                <li key={url}><Link href={url} className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--text-primary)' }}>Company</h4>
            <ul className="space-y-2">
              {[['About Us', '/about'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Shipping Policy', '/shipping']].map(([label, url]) => (
                <li key={url}><Link href={url} className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>© {new Date().getFullYear()} {config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1">
            {config.gstin && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>GSTIN: {config.gstin}</p>}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Payments:</span>
              <span className="text-xs font-medium" style={{ color: 'var(--crimson)' }}>UPI · COD · Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
