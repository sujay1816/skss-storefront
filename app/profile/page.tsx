'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { INDIAN_STATES } from '@/lib/utils'
import type { UserProfile, Address } from '@/types'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'profile' | 'addresses'>('profile')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) { setProfile({ id: p.id, email: p.email, fullName: p.full_name, phone: p.phone, avatarUrl: p.avatar_url, role: p.role, isBlocked: p.is_blocked, whatsappOptedIn: p.whatsapp_opted_in, createdAt: p.created_at }); setName(p.full_name || ''); setPhone(p.phone || ''); setWhatsapp(p.whatsapp_opted_in) }
      const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', user.id)
      if (addrs) setAddresses(addrs.map((a: any) => ({ id: a.id, userId: a.user_id, fullName: a.full_name, phone: a.phone, addressLine1: a.address_line1, addressLine2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode, isDefault: a.is_default })))
    }
    load()
  }, [])

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: name, phone, whatsapp_opted_in: whatsapp }).eq('id', profile.id)
    if (!error) toast.success('Profile updated!'); else toast.error('Could not update profile')
    setSaving(false)
  }

  const setDefault = async (id: string) => {
    const supabase = createClient()
    if (!profile) return
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', profile.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
    toast.success('Default address updated')
  }

  const deleteAddress = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    toast.success('Address removed')
  }

  return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      <h1 className="section-heading mb-8">My Profile</h1>
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {(['profile', 'addresses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="pb-3 text-xs font-semibold tracking-widest uppercase transition-all border-b-2"
            style={{ borderColor: tab === t ? 'var(--crimson)' : 'transparent', color: tab === t ? 'var(--crimson)' : 'var(--text-secondary)' }}>
            {t === 'profile' ? 'Account Details' : 'Saved Addresses'}
          </button>
        ))}
      </div>
      {tab === 'profile' && profile && (
        <div className="space-y-4">
          <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email (cannot change)</label><input className="input-base" value={profile.email} disabled style={{ opacity: 0.6 }} /></div>
          <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label><input className="input-base" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Phone</label><input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)} className="w-4 h-4" style={{ accentColor: 'var(--crimson)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Receive WhatsApp updates on orders & offers</span>
          </label>
          <button onClick={saveProfile} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      )}
      {tab === 'addresses' && (
        <div className="space-y-3">
          {addresses.length === 0 && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No saved addresses. Add one at checkout.</p>}
          {addresses.map(a => (
            <div key={a.id} className="p-4 border flex items-start justify-between" style={{ borderColor: 'var(--border)', background: a.isDefault ? 'var(--cream)' : 'white' }}>
              <div className="text-sm">
                <p className="font-medium">{a.fullName} · {a.phone}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{a.city}, {a.state} – {a.pincode}</p>
                {a.isDefault && <span className="text-xs mt-1 inline-block" style={{ color: 'var(--gold)' }}>Default</span>}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {!a.isDefault && <button onClick={() => setDefault(a.id)} className="text-xs" style={{ color: 'var(--crimson)' }}>Set Default</button>}
                <button onClick={() => deleteAddress(a.id)} className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
