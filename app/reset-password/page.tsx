'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

type PageState = 'waiting'   // processing the reset link — waiting for Supabase session
               | 'ready'     // session confirmed, show form
               | 'expired'   // link expired or already used
               | 'success'   // password updated successfully

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>('waiting')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for PASSWORD_RECOVERY event — Supabase fires this when the user
    // lands on this page via the reset link. It processes the token in the URL
    // hash and establishes a temporary session. We must wait for this before
    // calling updateUser() otherwise it fails with "not authenticated".
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is now set — safe to show the form
        setPageState('ready')
      }
      if (event === 'SIGNED_IN') {
        // Also fires on recovery — make sure we show the form
        setPageState('ready')
      }
    })

    // Fallback timeout — if no PASSWORD_RECOVERY fires within 5s,
    // the link is expired, already used, or the user navigated here directly
    const timeout = setTimeout(() => {
      setPageState(prev => prev === 'waiting' ? 'expired' : prev)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      // Token may have expired between page load and form submit
      if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
        setPageState('expired')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }
    // Sign out after password update so user logs in fresh with new password
    await supabase.auth.signOut()
    setPageState('success')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--ivory)' }}>
      <div className="w-full max-w-sm">

        {/* Waiting — processing reset link */}
        {pageState === 'waiting' && (
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin mb-4"
              style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Verifying your reset link...
            </p>
          </div>
        )}

        {/* Expired or invalid link */}
        {pageState === 'expired' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FEE2E2' }}>
              <span style={{ fontSize: 24 }}>✕</span>
            </div>
            <h1 className="text-2xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Link Expired
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This password reset link has expired or already been used. Reset links are valid for 1 hour.
            </p>
            <a href="/forgot-password" className="btn-primary inline-flex justify-center">
              Request a New Link
            </a>
          </div>
        )}

        {/* Form — ready to set new password */}
        {pageState === 'ready' && (
          <>
            <h1 className="text-3xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              New Password
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Choose a strong password for your account.
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-base pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input-base pr-10"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    style={{ borderColor: confirm && confirm !== password ? 'var(--crimson)' : undefined }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || (!!confirm && confirm !== password)}
                className="btn-primary w-full justify-center"
                style={{ opacity: loading || (!!confirm && confirm !== password) ? 0.6 : 1 }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {/* Success */}
        {pageState === 'success' && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#DCFCE7' }}>
              <span style={{ fontSize: 24 }}>✓</span>
            </div>
            <h1 className="text-2xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              Password Updated!
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Your password has been changed. Please sign in with your new password.
            </p>
            <a href="/login" className="btn-primary inline-flex justify-center">
              Sign In
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
