'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    router.push(redirect); router.refresh()
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}` } })
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--ivory)' }}>
      <div className="hidden lg:flex w-1/2 items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--crimson-dark) 0%, var(--crimson) 100%)' }}>
        <div className="text-center">
          <Image src="/images/logo.png" alt="SKSS" width={120} height={120} className="mx-auto mb-6 object-contain" />
          <h2 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Welcome Back</h2>
          <p className="text-sm text-white/70">Pure Silk. Timeless Tradition. Royal Elegance.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8"><Image src="/images/logo.png" alt="SKSS" width={60} height={60} className="mx-auto mb-3 object-contain" /></div>
          <h1 className="text-3xl font-light mb-8" style={{ fontFamily: 'var(--font-heading)' }}>Sign In</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email Address</label><input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></div>
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-base" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPass(!showPass)} style={{ color: 'var(--text-secondary)' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div className="text-right"><Link href="/forgot-password" className="text-xs" style={{ color: 'var(--crimson)' }}>Forgot Password?</Link></div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
          <div className="my-6 flex items-center gap-3"><div className="flex-1 h-px" style={{ background: 'var(--border)' }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>or</span><div className="flex-1 h-px" style={{ background: 'var(--border)' }} /></div>
          <button onClick={handleGoogle} className="btn-outline w-full justify-center gap-3"><span className="font-semibold" style={{ color: '#4285F4' }}>G</span> Continue with Google</button>
          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-secondary)' }}>Don't have an account? <Link href="/signup" className="font-medium" style={{ color: 'var(--crimson)' }}>Sign Up</Link></p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><LoginForm /></Suspense>
}
