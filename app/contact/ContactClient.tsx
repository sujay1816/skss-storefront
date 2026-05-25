'use client'
import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ContactClient({ cfg }: { cfg: Record<string, string> }) {
  const phone = cfg.whatsapp_number && cfg.whatsapp_number !== '+919999999999' ? cfg.whatsapp_number : ''
  const email = cfg.support_email && cfg.support_email !== 'support@skss.in' ? cfg.support_email : ''
  const address = cfg.business_address || ''
  const hours = cfg.contact_hours || 'Mon–Sat: 10:00 AM – 7:00 PM'
  const mapUrl = cfg.contact_map_url || ''

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formSending, setFormSending] = useState(false)
  const [formSent, setFormSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) return
    setFormSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('contact_messages').insert({
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || null,
        message: formMessage.trim(),
        created_at: new Date().toISOString(),
      })
      if (error) throw error
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact_message', name: formName.trim(), customerEmail: formEmail.trim(), phone: formPhone.trim() || undefined, message: formMessage.trim() }),
      }).catch(() => {})
      setFormSent(true)
    } catch {
      toast.error("Something went wrong. Please try again or contact us directly.")
    }
    setFormSending(false)
  }

  const contacts = [
    phone && { icon: <Phone size={20} />, label: 'Call / WhatsApp', value: phone, href: `tel:${phone.replace(/\D/g, '')}`, waHref: `https://wa.me/${phone.replace(/\D/g, '')}` },
    email && { icon: <Mail size={20} />, label: 'Email', value: email, href: `mailto:${email}` },
    address && { icon: <MapPin size={20} />, label: 'Address', value: address, href: mapUrl || '#' },
    { icon: <Clock size={20} />, label: 'Business Hours', value: hours, href: null },
  ].filter(Boolean)

  return (
    <div className="page-container py-16 max-w-4xl">
      <div className="animate-fadeIn">
        <div className="text-center mb-12">
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>Get In Touch</p>
          <h1 className="text-4xl font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Contact Us</h1>
          <div className="w-16 h-px mx-auto" style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
          <p className="text-sm mt-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            We'd love to hear from you. Reach out for any queries about our sarees, orders, or anything else.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {contacts.map((c: any, i) => (
            <div key={i}
              className="p-6 rounded-lg border flex items-start gap-4" style={{ borderColor: 'var(--border)', background: 'white' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cream)', color: 'var(--crimson)' }}>
                {c.icon}
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
                {c.href && c.href !== '#' ? (
                  <div>
                    <a href={c.href} className="text-sm font-medium transition-colors block" style={{ color: 'var(--crimson)' }}
                      target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                      {c.value}
                    </a>
                    {(c as any).waHref && (
                      <a href={(c as any).waHref} target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-1 inline-block" style={{ color: 'var(--text-secondary)' }}>
                        Also on WhatsApp →
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-light mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Send Us a Message</h2>
          {formSent ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#16A34A' }} />
              <p className="text-lg font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Message Sent!</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>We'll get back to you within 24 hours.</p>
              <button type="button" onClick={() => { setFormSent(false); setFormName(''); setFormEmail(''); setFormPhone(''); setFormMessage('') }} className="btn-outline text-xs">Send Another Message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Your Name *</label>
                  <input className="input-base" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" required disabled={formSending} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email Address *</label>
                  <input type="email" autoComplete="email" className="input-base" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="you@example.com" required disabled={formSending} />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Phone <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 11 }}>(optional)</span></label>
                <input type="tel" autoComplete="tel" inputMode="tel" className="input-base" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" disabled={formSending} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Message *</label>
                <textarea className="input-base" value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="How can we help you?" required disabled={formSending} style={{ height: 120, padding: '12px 14px', resize: 'none' }} />
              </div>
              <button type="submit" disabled={formSending || !formName.trim() || !formEmail.trim() || !formMessage.trim()} className="btn-primary" style={{ opacity: formSending ? 0.7 : 1 }}>
                {formSending ? (
                  <><span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                ) : (
                  <><Send size={14} /> Send Message</>
                )}
              </button>
            </form>
          )}
        </div>

        {(!phone && !email && !address) && (
          <div className="text-center py-12 rounded-lg border mt-8" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
            <p className="text-lg font-light mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Contact details coming soon</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Update from Admin → Config → Store Settings</p>
          </div>
        )}
      </div>
    </div>
  )
}
