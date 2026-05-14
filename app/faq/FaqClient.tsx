'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
// FIX: Removed framer-motion — accordion uses CSS max-height transition,
// chevron uses CSS rotate. Zero JS animation overhead.
// Also removed stagger delay (i * 0.07s) — made last FAQ item appear 700ms late.

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
          <div key={i}
            className="border rounded-lg overflow-hidden faq-item"
            style={{ borderColor: open === i ? 'var(--gold)' : 'var(--border)' }}>
            <button
              className="w-full flex items-center justify-between p-5 text-left transition-colors"
              style={{ background: open === i ? 'var(--cream)' : 'white' }}
              onClick={() => setOpen(open === i ? null : i)}>
              <span className="text-sm font-medium pr-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: 16 }}>
                {faq.q}
              </span>
              {/* FIX: CSS rotate instead of motion.div */}
              <span className="faq-chevron flex-shrink-0" style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <ChevronDown size={18} style={{ color: 'var(--crimson)' }} />
              </span>
            </button>
            {/* FIX: CSS max-height accordion instead of AnimatePresence */}
            <div className="faq-body" style={{ maxHeight: open === i ? '400px' : '0' }}>
              <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {faq.a}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
