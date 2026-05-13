'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/reset-password`,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSentTo(email.trim())
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--ivory)' }}>
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h1 className="text-2xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Check Your Email</h1>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>We sent a password reset link to</p>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--crimson)' }}>{sentTo}</p>
            <p className="text-xs mb-8" style={{ color: 'var(--text-secondary)' }}>
              Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>
            <div className="space-y-3">
              <button onClick={() => { setSent(false); setEmail('') }} className="btn-outline w-full justify-center text-xs">
                Try a different email
              </button>
              <Link href="/login" className="block text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                ← Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Forgot Password</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email address</label>
                <input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading
                  ? <><span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                  : 'Send Reset Link'
                }
              </button>
            </form>
            <Link href="/login" className="block text-center mt-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
              ← Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
