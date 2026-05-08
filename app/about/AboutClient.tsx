'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function AboutClient({ cfg }: { cfg: Record<string, string> }) {
  const title = cfg.about_title || 'About Us'
  const content = cfg.about_content || ''
  const brandName = cfg.brand_name || 'Our Store'
  const logoUrl = cfg.logo_url || '/images/logo.png'

  return (
    <div className="page-container py-16 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-4 mb-8">
          <Image src={logoUrl} alt={brandName} width={64} height={64} className="object-contain" />
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--gold)' }}>Our Story</p>
            <h1 className="text-4xl font-light" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
          </div>
        </div>
        <div className="w-full h-px mb-10" style={{ background: 'linear-gradient(to right, var(--gold), transparent)' }} />
        {content ? (
          <div className="prose-custom" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
            <p className="text-lg font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Content coming soon</p>
            <p className="text-sm">Update this page from Admin → Pages</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
