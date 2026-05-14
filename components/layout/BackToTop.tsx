'use client'
import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

// FIX: Removed framer-motion — replaced with CSS transition (GPU-accelerated, zero JS overhead)
// Moved right:4.5rem so it no longer overlaps the WhatsApp button (which is at right:1rem)
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="back-to-top-btn"
      style={{
        // FIX: moved right to 4.5rem so it doesn't overlap WhatsApp button at right:1rem
        bottom: '6rem',
        right: '4.5rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}>
      <ChevronUp size={18} />
    </button>
  )
}
