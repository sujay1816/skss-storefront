'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

// FIX #9: reuse the same phone validation as checkout
const validatePhone = (phone: string): boolean => {
  if (!phone) return true // empty is allowed (optional field)
  const clean = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+91|91)?[6-9]\d{9}$/.test(clean)
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'profile' | 'addresses'>('profile')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [whatsapp, setWhatsapp] = useState(true)
  const [addresses, setAddresses] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      // FIX #4: use getUser() instead of getSession() for server-validated auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const uid = user.id
      const userEmail = user.email || ''
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setUserId(uid); setEmail(userEmail)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (profile) {
        setName(profile.full_name || metaName)
        setPhone(profile.phone || '')
        setWhatsapp(profile.whatsapp_opted_in !== false)
      } else {
        await supabase.from('profiles').insert({ id: uid, email: userEmail, full_name: metaName, role: 'customer', whatsapp_opted_in: true })
        setName(metaName)
      }
      const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', uid).order('is_default', { ascending: false })
      setAddresses(addrs || [])
      setLoading(false)
    }
    load()
  }, [])

  const handlePhoneChange = (val: string) => {
    setPhone(val)
    // FIX #9: validate phone on change
    if (val && !validatePhone(val)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number')
    } else {
      setPhoneError('')
    }
  }

  const save = async () => {
    if (!userId) return
    // FIX #9: block save if phone is invalid
    if (phone && !validatePhone(phone)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number')
      toast.error('Please enter a valid phone number')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({ id: userId, email, full_name: name, phone, whatsapp_opted_in: whatsapp })
    if (error) {
      toast.error('Could not save profile. Please try again.')
    } else {
      toast.success('Profile updated!')
    }
    setSaving(false)
  }

  const setDefault = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.rpc('set_default_address', {
      p_user_id: userId,
      p_address_id: id,
    })
    if (error) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
      await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    }
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
    toast.success('Default address set')
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    toast.success('Address removed')
  }

  if (loading) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', width: 32, height: 32, border: '2px solid #8B1A2B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ marginTop: 12, color: '#5A4A3A', fontSize: 14 }}>Loading your profile...</p>
    </div>
  )

  return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="section-heading mb-8">My Profile</h1>
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {(['profile', 'addresses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="pb-3 text-xs font-semibold tracking-widest uppercase border-b-2 transition-all"
            style={{ borderColor: tab === t ? 'var(--crimson)' : 'transparent', color: tab === t ? 'var(--crimson)' : 'var(--text-secondary)' }}>
            {t === 'profile' ? 'Account Details' : 'Saved Addresses'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input className="input-base" value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input className="input-base" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Phone</label>
            <input
              className="input-base"
              value={phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              type="tel"
              style={{ borderColor: phoneError ? 'var(--crimson)' : undefined }}
            />
            {/* FIX #9: show validation error */}
            {phoneError && <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>{phoneError}</p>}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--crimson)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Receive WhatsApp updates</span>
          </label>
          <button onClick={save} disabled={saving || !!phoneError} className="btn-primary"
            style={{ opacity: saving || phoneError ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'addresses' && (
        <div className="space-y-3">
          {addresses.length === 0 && (
            <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>No saved addresses. Add one at checkout.</p>
          )}
          {addresses.map(a => (
            <div key={a.id} className="p-4 border flex items-start justify-between"
              style={{ borderColor: 'var(--border)', background: a.is_default ? 'var(--cream)' : 'white' }}>
              <div className="text-sm">
                <p className="font-medium">{a.full_name} · {a.phone}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{a.city}, {a.state} – {a.pincode}</p>
                {a.is_default && <span className="text-xs mt-1 inline-block" style={{ color: 'var(--gold)' }}>✓ Default</span>}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {!a.is_default && <button onClick={() => setDefault(a.id)} className="text-xs" style={{ color: 'var(--crimson)' }}>Set Default</button>}
                <button onClick={() => remove(a.id)} className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
