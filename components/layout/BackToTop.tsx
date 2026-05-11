'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp } from 'lucide-react'

// Issue 16 fix — back to top button
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed z-40 w-10 h-10 flex items-center justify-center border shadow-md transition-all"
          style={{
            bottom: '6rem',
            right: '1.5rem',
            background: 'white',
            borderColor: 'var(--border)',
            borderRadius: 4,
          }}
          whileHover={{ background: 'var(--crimson)', borderColor: 'var(--crimson)' }}
          aria-label="Back to top">
          <ChevronUp size={18} style={{ color: 'inherit' }} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
