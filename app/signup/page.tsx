'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` } })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! Please check your email to verify.')
    router.push('/login')
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--ivory)' }}>
      <div className="hidden lg:flex w-1/2 items-center justify-center" style={{ background: 'linear-gradient(135deg, #2C1810 0%, var(--crimson-dark) 50%, var(--crimson) 100%)' }}>
        <div className="text-center">
          <Image src="/images/logo.png" alt="SKSS" width={120} height={120} className="mx-auto mb-6 object-contain" />
          <h2 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Join the Legacy</h2>
          <p className="text-sm text-white/70">Create your account and experience royal elegance</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-light mb-8" style={{ fontFamily: 'var(--font-heading)' }}>Create Account</h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label><input type="text" className="input-base" value={name} onChange={e => setName(e.target.value)} required autoFocus /></div>
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email Address</label><input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-base pr-10" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPass(!showPass)} style={{ color: 'var(--text-secondary)' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Creating account...' : 'Create Account'}</button>
          </form>
          <div className="my-6 flex items-center gap-3"><div className="flex-1 h-px" style={{ background: 'var(--border)' }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>or</span><div className="flex-1 h-px" style={{ background: 'var(--border)' }} /></div>
          <button onClick={handleGoogle} className="btn-outline w-full justify-center gap-3"><span className="font-semibold" style={{ color: '#4285F4' }}>G</span> Continue with Google</button>
          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-secondary)' }}>Already have an account? <Link href="/login" className="font-medium" style={{ color: 'var(--crimson)' }}>Sign In</Link></p>
        </div>
      </div>
    </div>
  )
}
