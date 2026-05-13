'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    // FIX #6: confirm password check
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Password updated! Please sign in.')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--ivory)' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>New Password</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Choose a strong password for your account.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>New password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-base pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Confirm new password</label>
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
      </div>
    </div>
  )
}
