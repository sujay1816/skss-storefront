'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--ivory)' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Reset Password</h1>
        {sent ? (
          <div className="p-4 border text-sm" style={{ borderColor: 'var(--gold)', background: 'var(--cream)' }}>
            <p>Check your email for a reset link!</p>
            <Link href="/login" className="mt-3 inline-block text-xs" style={{ color: 'var(--crimson)' }}>← Back to Login</Link>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
            <Link href="/login" className="block text-center mt-6 text-xs" style={{ color: 'var(--text-secondary)' }}>← Back to Login</Link>
          </>
        )}
      </div>
    </div>
  )
}
