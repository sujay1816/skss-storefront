'use client'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

export default function ContactClient({ cfg }: { cfg: Record<string, string> }) {
  const phone = cfg.whatsapp_number && cfg.whatsapp_number !== '+919999999999' ? cfg.whatsapp_number : ''
  const email = cfg.support_email && cfg.support_email !== 'support@skss.in' ? cfg.support_email : ''
  const address = cfg.business_address || ''
  const hours = cfg.contact_hours || 'Mon–Sat: 10:00 AM – 7:00 PM'
  const mapUrl = cfg.contact_map_url || ''

  const contacts = [
    phone && { icon: <MessageCircle size={20} />, label: 'WhatsApp', value: phone, href: `https://wa.me/${phone.replace(/\D/g, '')}` },
    email && { icon: <Mail size={20} />, label: 'Email', value: email, href: `mailto:${email}` },
    address && { icon: <MapPin size={20} />, label: 'Address', value: address, href: mapUrl || '#' },
    { icon: <Clock size={20} />, label: 'Business Hours', value: hours, href: null },
  ].filter(Boolean)

  return (
    <div className="page-container py-16 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Get In Touch</p>
          <h1 className="text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Contact Us</h1>
          <div className="w-16 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
          <p className="text-sm mt-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            We'd love to hear from you. Reach out for any queries about our sarees, orders, or anything else.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {contacts.map((c: any, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-lg border flex items-start gap-4"
              style={{ borderColor: 'var(--border)', background: 'white' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--cream)', color: 'var(--crimson)' }}>
                {c.icon}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
                {c.href && c.href !== '#' ? (
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="text-sm font-medium transition-colors"
                    style={{ color: 'var(--crimson)' }}>
                    {c.value}
                  </a>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {(!phone && !email && !address) && (
          <div className="text-center py-12 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
            <p className="text-lg font-light mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Contact details coming soon</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Update from Admin → Config → Store Settings</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
