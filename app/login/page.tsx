'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
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
    toast.success('Welcome back!')
    router.push('/')
    router.refresh()
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/` }
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0D0D0D', fontFamily: 'DM Sans, sans-serif' }}>
      <div className="hidden lg:flex" style={{ width: '50%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #1A0510 0%, #2D0A1E 25%, #8B1A2B 50%, #C9A84C 70%, #2D0A1E 90%, #1A0510 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'repeating-linear-gradient(0deg, #C9A84C 0px, #C9A84C 2px, transparent 2px, transparent 20px), repeating-linear-gradient(90deg, #C9A84C 0px, #C9A84C 2px, transparent 2px, transparent 20px)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)' }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 48, textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: -32, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)' }} />
            <Image src="/images/logo.png" alt="SKSS" width={90} height={90} style={{ objectFit: 'contain', position: 'relative' }} />
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 300, color: 'white', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>Sai Krishna</h1>
          <p style={{ color: '#C9A84C', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 20 }}>{config?.brand_subtitle || '✦ SILKS & SAREES ✦'}</p>
          <div style={{ width: 80, height: 1, background: 'linear-gradient(to right, transparent, #C9A84C, transparent)', marginBottom: 20 }} />
          <p style={{ fontSize: 18, fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
            "Pure Silk. Timeless Tradition.<br />Royal Elegance."
          </p>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#111111', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 20 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>← Back to store</Link>
        </div>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
            <Image src="/images/logo.png" alt="SKSS" width={50} height={50} style={{ objectFit: 'contain', margin: '0 auto 8px' }} />
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 300, color: 'white', marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Sign in to your account</p>
          <button onClick={handleGoogle} disabled={googleLoading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 16px', marginBottom: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, cursor: 'pointer' }}>
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
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: '#C9A84C', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 44px 12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', fontSize: 14, outline: 'none' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg, #8B1A2B 0%, #6B1220 100%)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={14} /></>}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 24 }}>
            Don't have an account? <Link href="/signup" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
