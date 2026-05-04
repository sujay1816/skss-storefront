'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Password updated!')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--ivory)' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light mb-6" style={{ fontFamily: 'var(--font-heading)' }}>New Password</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <input type="password" className="input-base" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password (min 6 chars)" required minLength={6} />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  )
}
