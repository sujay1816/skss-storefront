'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    toast.success('Message sent! We\'ll get back to you within 24 hours.')
  }
  return (
    <div className="page-container py-16 max-w-2xl animate-fadeIn">
      <h1 className="section-heading mb-4">Contact Us</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>We'd love to hear from you. Write to us and we'll get back within 24 hours.</p>
      {sent ? (
        <div className="p-6 border text-center" style={{ borderColor: 'var(--gold)', background: 'var(--cream)' }}>
          <p className="text-lg" style={{ fontFamily: 'var(--font-heading)' }}>Thank you for reaching out! ✨</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We'll reply to you at {form.email} within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {[['name','Full Name','text'],['email','Email Address','email'],['phone','Phone Number','tel']].map(([key,label,type]) => (
            <div key={key}><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>{label}</label><input type={type} className="input-base" value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required={key !== 'phone'} /></div>
          ))}
          <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Message</label><textarea className="input-base w-full" style={{ height: 120, padding: '12px 14px', resize: 'none' }} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required /></div>
          <button type="submit" className="btn-primary">Send Message</button>
        </form>
      )}
    </div>
  )
}
