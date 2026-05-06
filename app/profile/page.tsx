'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { INDIAN_STATES } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'profile' | 'addresses'>('profile')
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState(true)
  const [addresses, setAddresses] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      // Use getSession (works for both email and Google OAuth)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        window.location.href = '/login'
        return
      }

      const uid = session.user.id
      setUserId(uid)
      setEmail(session.user.email || '')

      // Try to get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      if (profile) {
        setName(profile.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '')
        setPhone(profile.phone || '')
        setWhatsapp(profile.whatsapp_opted_in !== false)
      } else {
        // Create profile if missing (Google OAuth users)
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
        setName(fullName)
        await supabase.from('profiles').insert({
          id: uid,
          email: session.user.email || '',
          full_name: fullName,
          role: 'customer',
          whatsapp_opted_in: true,
        })
      }

      // Load addresses
      const { data: addrs } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', uid)
        .order('is_default', { ascending: false })
      setAddresses(addrs || [])
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, full_name: name, phone, whatsapp_opted_in: whatsapp })
    if (!error) toast.success('Profile updated!')
    else toast.error('Could not update profile')
    setSaving(false)
  }

  const setDefaultAddress = async (id: string) => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
    toast.success('Default address updated')
  }

  const deleteAddress = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    toast.success('Address removed')
  }

  if (loading) return (
    <div className="page-container py-20 text-center">
      <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin mb-3"
        style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading your profile...</p>
    </div>
  )

  return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      <h1 className="section-heading mb-8">My Profile</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {(['profile', 'addresses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="pb-3 text-xs font-semibold tracking-widest uppercase transition-all border-b-2"
            style={{ borderColor: tab === t ? 'var(--crimson)' : 'transparent', color: tab === t ? 'var(--crimson)' : 'var(--text-secondary)' }}>
            {t === 'profile' ? 'Account Details' : 'Saved Addresses'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email (cannot change)</label>
            <input className="input-base" value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input className="input-base" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Phone</label>
            <input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)}
              className="w-4 h-4" style={{ accentColor: 'var(--crimson)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Receive WhatsApp updates on orders & offers
            </span>
          </label>
          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'addresses' && (
        <div className="space-y-3">
          {addresses.length === 0 && (
            <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
              No saved addresses. Add one at checkout.
            </p>
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
                {!a.is_default && (
                  <button onClick={() => setDefaultAddress(a.id)} className="text-xs" style={{ color: 'var(--crimson)' }}>
                    Set Default
                  </button>
                )}
                <button onClick={() => deleteAddress(a.id)} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
