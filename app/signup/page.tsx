'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
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
    toast.success('Account created! Welcome to SKSS.')
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

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'white',
    borderRadius: '8px',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'DM Sans, sans-serif',
  }

  const benefits = [
    'Early access to new arrivals',
    'Exclusive member-only discounts',
    'Order tracking & full history',
    'Wishlist synced across all devices',
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0D0D0D', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Left — Silk panel */}
      <div className="hidden lg:flex" style={{ width: '50%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0A1A0E 0%, #0F2C18 35%, #1B6B35 65%, #0F2C18 85%, #0A1A0E 100%)' }} />
        {/* Silk fold effect */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 14}%`, width: '10%', background: `linear-gradient(to right, rgba(0,0,0,${0.1 + i * 0.02}), transparent, rgba(0,0,0,0.05))`, transform: `skewX(${i % 2 === 0 ? 1.5 : -1.5}deg)` }} />
        ))}
        {/* Weave pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}>
          <defs>
            <pattern id="weave2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="10" height="2" fill="#C9A84C" /><rect x="10" y="10" width="10" height="2" fill="#C9A84C" />
              <rect x="0" y="0" width="2" height="10" fill="#C9A84C" /><rect x="10" y="10" width="2" height="10" fill="#C9A84C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#weave2)" />
        </svg>
        {/* Gold border lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        {/* Corner decorations */}
        {[['top:24px;left:24px;border-right:none;border-bottom:none', 'top:24px;right:24px;border-left:none;border-bottom:none'], ['bottom:24px;left:24px;border-right:none;border-top:none', 'bottom:24px;right:24px;border-left:none;border-top:none']].flat().map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 60, height: 60, border: '1px solid rgba(201,168,76,0.4)', ...Object.fromEntries(s.split(';').filter(Boolean).map(p => { const [k, v] = p.split(':'); return [k.replace(/-([a-z])/g, (_, l) => l.toUpperCase()), v] })) }} />
        ))}
        {/* Floating sarees */}
        <div style={{ position: 'absolute', top: '20%', left: 30, fontSize: 64, opacity: 0.18, transform: 'rotate(-12deg)' }}>🥻</div>
        <div style={{ position: 'absolute', bottom: '25%', right: 40, fontSize: 48, opacity: 0.15, transform: 'rotate(8deg)' }}>🥻</div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '48px', textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: -32, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)' }} />
            <Image src="/images/logo.png" alt="SKSS" width={90} height={90} style={{ objectFit: 'contain', position: 'relative' }} />
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 300, color: 'white', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>Join the Legacy</h1>
          <p style={{ color: '#C9A84C', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 24 }}>✦ Sai Krishna Silks & Sarees ✦</p>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)', marginBottom: 24 }} />
          <p style={{ fontSize: 17, fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
            "Create your account and experience<br />the finest silk collections"
          </p>
          {/* Benefits */}
          <div style={{ marginTop: 36, width: '100%', maxWidth: 260, textAlign: 'left' }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} style={{ color: '#C9A84C' }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#111111', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 }}>
            ← Back to store
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <Image src="/images/logo.png" alt="SKSS" width={50} height={50} style={{ objectFit: 'contain', margin: '0 auto 12px' }} />
            <p style={{ color: '#C9A84C', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase' }}>✦ Sai Krishna Silks ✦</p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 30, fontWeight: 300, color: 'white', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>Create account</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Join thousands of saree lovers across India</p>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 16px', marginBottom: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#8B1A2B')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? 'rgba(139,26,43,0.5)' : 'linear-gradient(135deg, #8B1A2B 0%, #6B1220 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 20px rgba(139,26,43,0.35)', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>
              {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}>
      <SignupForm />
    </Suspense>
  )
}
