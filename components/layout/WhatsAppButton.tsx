'use client'
import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function WhatsAppButton({ number, message }: { number: string; message?: string }) {
  const pathname = usePathname()
  const clean = number.replace(/\D/g, '')
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message || 'Hi! I need help with my order.')}`

  // Hide on checkout / cart to avoid distraction during payment
  const hideOnPaths = ['/checkout', '/cart']
  if (!clean || clean === '919999999999' || hideOnPaths.some(p => pathname?.startsWith(p))) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-btn"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} className="text-white" fill="white" />
    </a>
  )
}
