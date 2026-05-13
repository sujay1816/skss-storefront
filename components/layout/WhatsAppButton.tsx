'use client'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function WhatsAppButton({ number, message }: { number: string; message?: string }) {
  const pathname = usePathname()
  const clean = number.replace(/\D/g, '')
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message || 'Hi! I need help with my order.')}`

  // UI/UX: hide on checkout to avoid distraction during payment
  const hideOnPaths = ['/checkout', '/cart']
  if (!clean || clean === '919999999999' || hideOnPaths.some(p => pathname?.startsWith(p))) return null
  return (
    // FIX #10: on mobile raise to bottom-20 (80px) to clear any sticky product/checkout bars
    // On desktop stays at bottom-6 (24px)
    <motion.a href={url} target="_blank" rel="noopener noreferrer"
      className="fixed z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      style={{
        background: '#25D366',
        bottom: '5rem',    // 80px — clears sticky product bar on mobile
        right: '1rem',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      aria-label="Chat on WhatsApp">
      <MessageCircle size={26} className="text-white" fill="white" />
      <span className="absolute right-16 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none transition-opacity"
        style={{ top: '50%', transform: 'translateY(-50%)' }}>
        Chat on WhatsApp
      </span>
    </motion.a>
  )
}
