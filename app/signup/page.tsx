'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` }
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! You can now sign in.')
    router.push('/')
    router.refresh()
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
    if (error) { toast.error(error.message); setGoogleLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0D0D0D' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A1A0E 0%, #0F2C18 40%, #1A5C2B 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 75% 75%, #C9A84C 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          <div className="mb-8 relative">
            <div className="absolute -inset-6 rounded-full opacity-20" style={{ background: '#C9A84C', filter: 'blur(20px)' }} />
            <Image src="/images/logo.png" alt="SKSS" width={100} height={100} className="relative object-contain" />
          </div>
          <h1 className="text-5xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Join the Legacy</h1>
          <p className="text-lg tracking-widest mb-6" style={{ color: '#C9A84C', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Sai Krishna Silks &amp; Sarees</p>
          <div className="w-16 h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
          <p className="text-base font-light italic" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Cormorant Garamond, serif', fontSize: '18px' }}>
            "Create your account and experience<br />royal elegance"
          </p>
          <div className="mt-12 space-y-4 w-full max-w-xs text-left">
            {['Early access to new arrivals', 'Exclusive member discounts', 'Order tracking & history', 'Wishlist & saved items'].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)' }}>
                  <span style={{ color: '#C9A84C', fontSize: 10 }}>✓</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Signup form */}
      <div className="flex-1 flex items-center justify-center p-8 relative" style={{ background: '#111111' }}>
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image src="/images/logo.png" alt="SKSS" width={32} height={32} className="object-contain" />
          </Link>
          <Link href="/" className="text-xs flex items-center gap-1 ml-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>← Back to store</Link>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-light mb-2" style={{ color: 'white', fontFamily: 'Cormorant Garamond, serif' }}>Create account</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Join thousands of saree lovers across India</p>
          </div>

          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg mb-6 transition-all font-medium text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {[
              { label: 'Full Name', type: 'text', value: name, onChange: setName, placeholder: 'Your full name' },
              { label: 'Email Address', type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com' },
            ].map(({ label, type, value, onChange, placeholder }) => (
              <div key={label}>
                <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</label>
                <input type={type} value={value} onChange={e => onChange(e.target.value)} required placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
            ))}
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all pr-10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPass(!showPass)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{ background: loading ? 'rgba(139,26,43,0.5)' : '#8B1A2B', color: 'white' }}>
              {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium" style={{ color: '#C9A84C' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading...</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
