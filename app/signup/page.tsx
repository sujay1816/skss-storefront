'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function SignupForm() {
  const searchParams = useSearchParams()
  // FIX: same bug as login — useSearchParams() reads correctly, window.location.search does not
  const redirect = searchParams.get('redirect') || '/'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  // FIX #2: show email-sent screen instead of redirecting immediately
  const [emailSent, setEmailSent] = useState(false)
  const [brandName, setBrandName] = useState(process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store')
  const [brandSubtitle, setBrandSubtitle] = useState('SILKS & SAREES')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('site_config').select('key, value')
      .in('key', ['brand_name', 'brand_subtitle', 'logo_url'])
      .then(({ data }) => {
        if (!data) return
        const cfg: Record<string, string> = {}
        data.forEach((r: any) => { if (r.value) cfg[r.key] = r.value })
        if (cfg.brand_name) setBrandName(cfg.brand_name)
        if (cfg.brand_subtitle) setBrandSubtitle(cfg.brand_subtitle)
        if (cfg.logo_url) setLogoUrl(cfg.logo_url)
      })
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error, data } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) {
      // FIX #7: friendly error messages for common signup errors
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        toast.error('An account with this email already exists. Try signing in.')
      } else if (error.message.toLowerCase().includes('password')) {
        toast.error('Password is too weak. Use at least 6 characters.')
      } else if (error.message.toLowerCase().includes('valid email') || error.message.toLowerCase().includes('invalid email')) {
        toast.error('Please enter a valid email address.')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }
    // FIX #2: Supabase signUp succeeds but user is NOT logged in yet —
    // they must confirm their email first. Show confirmation screen instead
    // of redirecting to a protected page where they'd be unauthenticated.
    if (data.user && !data.session) {
      // Email confirmation required (default Supabase behaviour)
      setEmailSent(true)
      setLoading(false)
      return
    }
    // If email confirmation is disabled in Supabase (session is returned immediately)
    toast.success(`Welcome to ${brandName}!`)
    // FIX: same as login — window.location.href ensures fresh cookie is sent
    window.location.href = redirect
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` }
    })
  }

  // FIX #2: email sent confirmation screen
  if (emailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111111', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
          <h2 style={{ fontSize: 28, fontWeight: 300, color: 'white', marginBottom: 12, fontFamily: 'Cormorant Garamond, serif' }}>
            Check your inbox
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a confirmation link to
          </p>
          <p style={{ color: '#C9A84C', fontSize: 15, fontWeight: 500, marginBottom: 24 }}>{email}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 }}>
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
          <Link href="/login"
            style={{ display: 'inline-block', padding: '13px 32px', background: 'linear-gradient(135deg, #8B1A2B 0%, #6B1220 100%)', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            Go to Login
          </Link>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            Wrong email?{' '}
            <button type="button" onClick={() => setEmailSent(false)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: 12 }}>
              Go back
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0D0D0D', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Left panel */}
      <div className="hidden lg:flex" style={{ width: '50%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #0A1A0E 0%, #0F2C18 35%, #1B6B35 60%, #0F2C18 85%, #0A1A0E 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'repeating-linear-gradient(0deg, #C9A84C 0px, #C9A84C 2px, transparent 2px, transparent 20px), repeating-linear-gradient(90deg, #C9A84C 0px, #C9A84C 2px, transparent 2px, transparent 20px)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 48, textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: -32, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)' }} />
            {logoUrl
              ? <Image src={logoUrl} alt={brandName} width={90} height={90} style={{ objectFit: 'contain', position: 'relative' }} />
              : <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(139,26,43,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'white', fontFamily: 'Cormorant Garamond, serif', position: 'relative' }}>S</div>}
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 300, color: 'white', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>Join the Legacy</h1>
          <p style={{ color: '#C9A84C', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 20 }}>{`✦ ${brandSubtitle} ✦`}</p>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)', marginBottom: 20 }} />
          <p style={{ fontSize: 18, fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
            "Create your account and<br />experience royal elegance"
          </p>
          <div style={{ marginTop: 36, textAlign: 'left', width: '100%', maxWidth: 260 }}>
            {['Early access to new arrivals', 'Exclusive member discounts', 'Order tracking & history', 'Wishlist across all devices'].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#C9A84C', fontSize: 10 }}>✓</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 5vw, 32px)', background: '#111111', position: 'relative', minHeight: '100svh' }}>
        <div style={{ position: 'absolute', top: 20, left: 20 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>← Back to store</Link>
        </div>

        <div style={{ width: '100%', maxWidth: 360, paddingTop: 40 }}>
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            {logoUrl
              ? <Image src={logoUrl} alt={brandName} width={50} height={50} style={{ objectFit: 'contain', margin: '0 auto 8px' }} />
              : <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(139,26,43,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', margin: '0 auto 8px' }}>S</div>}
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 300, color: 'white', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>Create account</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Join thousands of saree lovers</p>

          <button type="button" onClick={handleGoogle} disabled={googleLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 16px', marginBottom: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
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
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Full Name', type: 'text', value: name, set: setName, placeholder: 'Your full name', ac: 'name' },
              { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com', ac: 'email' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required placeholder={f.placeholder} autoComplete={(f as any).ac}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 16, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} onFocus={e => e.currentTarget.style.boxShadow='0 0 0 2px #C9A84C'} onBlur={e => e.currentTarget.style.boxShadow='none'} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" autoComplete="new-password"
                  style={{ width: '100%', padding: '12px 44px 12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 13, background: loading ? 'rgba(139,26,43,0.5)' : 'linear-gradient(135deg, #8B1A2B 0%, #6B1220 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif', boxShadow: '0 4px 20px rgba(139,26,43,0.4)' }}>
              {loading
                ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
                : <><span>Create Account</span><ArrowRight size={14} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 24 }}>
            Already have an account? <Link href="/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js App Router
export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#111111' }} />}>
      <SignupForm />
    </Suspense>
  )
}
