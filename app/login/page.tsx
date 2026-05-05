'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function SilkPanel() {
  return (
    <div className="hidden lg:flex w-1/2 relative overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* Layered silk gradient background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, #1A0510 0%, #2D0A1E 20%, #8B1A2B 45%, #C9A84C 65%, #2D0A1E 85%, #1A0510 100%)'
      }} />
      {/* Silk sheen overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(45deg, transparent 30%, rgba(201,168,76,0.15) 50%, transparent 70%)',
        animation: 'shimmer 4s ease-in-out infinite'
      }} />
      {/* Silk weave pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="weave" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="2" fill="#C9A84C" />
            <rect x="10" y="10" width="10" height="2" fill="#C9A84C" />
            <rect x="0" y="0" width="2" height="10" fill="#C9A84C" />
            <rect x="10" y="10" width="2" height="10" fill="#C9A84C" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#weave)" />
      </svg>
      {/* Draped fabric folds effect */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0" style={{
            left: `${i * 14}%`,
            width: '10%',
            background: `linear-gradient(to right, rgba(0,0,0,${0.1 + i * 0.03}), transparent, rgba(0,0,0,${0.05 + i * 0.02}))`,
            transform: `skewX(${i % 2 === 0 ? 2 : -2}deg)`
          }} />
        ))}
      </div>
      {/* Golden border motif at top and bottom */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, transparent, #C9A84C, #8B1A2B, #C9A84C, transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(to right, transparent, #C9A84C, #8B1A2B, #C9A84C, transparent)' }} />
      {/* Decorative corner motifs */}
      <div className="absolute top-6 left-6 w-16 h-16 opacity-40" style={{ border: '1px solid #C9A84C', borderRight: 'none', borderBottom: 'none' }} />
      <div className="absolute top-6 right-6 w-16 h-16 opacity-40" style={{ border: '1px solid #C9A84C', borderLeft: 'none', borderBottom: 'none' }} />
      <div className="absolute bottom-6 left-6 w-16 h-16 opacity-40" style={{ border: '1px solid #C9A84C', borderRight: 'none', borderTop: 'none' }} />
      <div className="absolute bottom-6 right-6 w-16 h-16 opacity-40" style={{ border: '1px solid #C9A84C', borderLeft: 'none', borderTop: 'none' }} />
      {/* Floating saree emoji decorations */}
      <div className="absolute top-1/4 left-8 text-6xl opacity-20" style={{ transform: 'rotate(-15deg)' }}>🥻</div>
      <div className="absolute top-1/3 right-10 text-4xl opacity-15" style={{ transform: 'rotate(10deg)' }}>🥻</div>
      <div className="absolute bottom-1/4 left-16 text-5xl opacity-15" style={{ transform: 'rotate(5deg)' }}>🥻</div>
      <div className="absolute bottom-1/3 right-8 text-3xl opacity-20" style={{ transform: 'rotate(-10deg)' }}>🥻</div>
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
        <div className="mb-6 relative">
          <div className="absolute -inset-8 rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)' }} />
          <Image src="/images/logo.png" alt="SKSS" width={90} height={90} className="relative object-contain drop-shadow-2xl" />
        </div>
        <h1 className="text-5xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          Sai Krishna
        </h1>
        <p className="tracking-widest mb-4" style={{ color: '#C9A84C', fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
          ✦ Silks &amp; Sarees ✦
        </p>
        <div className="w-24 h-px mb-6" style={{ background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        <p className="text-xl font-light italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Cormorant Garamond, serif' }}>
          "Pure Silk.<br />Timeless Tradition.<br />Royal Elegance."
        </p>
        <div className="mt-10 w-full max-w-xs">
          <div className="grid grid-cols-3 gap-3">
            {[['✦', '100% Pure Silk'], ['♛', 'Royal Quality'], ['↩', 'Easy Returns']].map(([icon, text], i) => (
              <div key={i} className="text-center p-3 rounded-lg" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div className="text-lg mb-1" style={{ color: '#C9A84C' }}>{icon}</div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', lineHeight: '1.3' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    router.push(redirect)
    router.refresh()
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?redirect=${redirect}` }
    })
    if (error) { toast.error(error.message); setGoogleLoading(false) }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: '8px',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0D0D0D' }}>
      <SilkPanel />
      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 relative" style={{ background: '#111111' }}>
        <div className="absolute top-6 right-6">
          <Link href="/" className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
            ← Back to store
          </Link>
        </div>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/images/logo.png" alt="SKSS" width={50} height={50} className="mx-auto mb-3 object-contain" />
            <p style={{ color: '#C9A84C', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>✦ Sai Krishna Silks ✦</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-light mb-2" style={{ color: 'white', fontFamily: 'Cormorant Garamond, serif' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to your account to continue</p>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-5 transition-all font-medium text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '8px' }}
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

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'rgba(255,255,255,0.45)' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Password</label>
                <Link href="/forgot-password" className="text-xs" style={{ color: '#C9A84C' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPass(!showPass)} style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all mt-2"
              style={{ background: loading ? 'rgba(139,26,43,0.5)' : 'linear-gradient(135deg, #8B1A2B 0%, #6B1220 100%)', color: 'white', borderRadius: '8px', boxShadow: loading ? 'none' : '0 4px 20px rgba(139,26,43,0.4)' }}>
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium" style={{ color: '#C9A84C' }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="text-center">
          <Image src="/images/logo.png" alt="SKSS" width={60} height={60} className="mx-auto mb-4 object-contain" />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
