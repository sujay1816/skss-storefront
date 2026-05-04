'use client'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton({ number, message }: { number: string; message?: string }) {
  const clean = number.replace(/\D/g, '')
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message || 'Hi! I need help with my order.')}`
  if (!clean || clean === '919999999999') return null
  return (
    <motion.a href={url} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      style={{ background: '#25D366' }}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      aria-label="Chat on WhatsApp">
      <MessageCircle size={26} className="text-white" fill="white" />
    </motion.a>
  )
}
