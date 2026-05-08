'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const DEFAULT_FAQS = [
  { q: 'Are your sarees 100% authentic?', a: 'Yes, all our sarees are sourced directly from weavers and certified silk boards across India.' },
  { q: 'What is your return policy?', a: 'We offer a 7-day return window for unused items in original packaging. Please contact us to initiate a return.' },
  { q: 'How long does delivery take?', a: 'Standard delivery takes 5-7 business days. Express delivery options are available at checkout.' },
  { q: 'Do you offer Cash on Delivery?', a: 'Yes, we offer Cash on Delivery across most Indian pincodes.' },
  { q: 'How do I care for my silk saree?', a: 'Dry clean only is recommended for pure silk sarees. Store in a cool, dry place wrapped in muslin cloth.' },
]

export default function FaqClient({ cfg }: { cfg: Record<string, string> }) {
  const [open, setOpen] = useState<number | null>(null)

  let faqs = DEFAULT_FAQS
  try {
    if (cfg.faq_items) {
      const parsed = JSON.parse(cfg.faq_items)
      if (Array.isArray(parsed) && parsed.length > 0) faqs = parsed
    }
  } catch {}

  return (
    <div className="page-container py-16 max-w-3xl">
      <div className="mb-12 text-center">
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Got Questions?</p>
        <h1 className="text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Frequently Asked Questions</h1>
        <div className="w-16 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
      </div>

      <div className="space-y-3">
        {faqs.map((faq: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: open === i ? 'var(--gold)' : 'var(--border)', transition: 'border-color 0.2s' }}>
            <button className="w-full flex items-center justify-between p-5 text-left transition-colors"
              style={{ background: open === i ? 'var(--cream)' : 'white' }}
              onClick={() => setOpen(open === i ? null : i)}>
              <span className="text-sm font-medium pr-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: 16 }}>
                {faq.q}
              </span>
              <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                <ChevronDown size={18} style={{ color: 'var(--crimson)' }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
