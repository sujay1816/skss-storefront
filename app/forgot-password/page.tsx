'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // FIX (H-6): Actually run the countdown timer.
  // Previously the cooldown state was declared but setCooldown was never called
  // with a non-zero value after sending, so the button was never rate-limited.
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0) return   // Guard: prevent double-submit while counting down
    setLoading(true)
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/reset-password`,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setSentTo(email.trim())
    setSent(true)
    // Start 60-second cooldown — prevents rapid-fire email floods
    setCooldown(COOLDOWN_SECONDS)
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
              <button
                type="button"
                onClick={() => { setSent(false) }}
                disabled={cooldown > 0}
                className="btn-outline w-full justify-center text-xs"
                style={{ opacity: cooldown > 0 ? 0.6 : 1 }}
              >
                {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend or try a different email'}
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
                <input
                  type="email"
                  autoComplete="email"
                  className="input-base"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="btn-primary w-full justify-center"
                style={{ opacity: loading || cooldown > 0 ? 0.6 : 1 }}
              >
                {loading
                  ? <><span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                  : cooldown > 0 ? `Resend in ${cooldown}s`
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
