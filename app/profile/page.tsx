'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
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
  const [actionId, setActionId] = useState<string | null>(null)
  const [tab, setTab] = useState<'profile' | 'addresses'>('profile')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [whatsapp, setWhatsapp] = useState(true)
  const [addresses, setAddresses] = useState<any[]>([])
  // FIX: address editing
  const [editingAddress, setEditingAddress] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string,string>>({})

  // ── Password change ──────────────────────────────────────────────────────
  // isGoogleUser: if the user signed up via Google they have no password to change
  const [isGoogleUser, setIsGoogleUser]       = useState(false)
  const [currentPass, setCurrentPass]         = useState('')
  const [newPass, setNewPass]                 = useState('')
  const [confirmPass, setConfirmPass]         = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass]         = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [passError, setPassError]             = useState('')
  const [passLoading, setPassLoading]         = useState(false)
  const [passSuccess, setPassSuccess]         = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      // FIX #4: use getUser() instead of getSession() for server-validated auth
      const { data: { user } } = await supabase.auth.getUser()
      // FIX: use router.push() not window.location.href (avoids hard reload that wipes cart state)
      // FIX: include redirect param so user returns to profile after login
      if (!user) { router.push('/login?redirect=/profile'); return }
      const uid = user.id
      const userEmail = user.email || ''
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setUserId(uid); setEmail(userEmail)
      // If the user signed in with Google, identities will contain a 'google' provider.
      // In that case we hide the password change section entirely.
      const identities = user.identities || []
      const isGoogle = identities.length > 0 && identities.every((id: any) => id.provider === 'google')
      setIsGoogleUser(isGoogle)
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
    setActionId(id)
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
    setActionId(null)
  }

  const remove = async (id: string) => {
    setActionId(id)
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
    toast.success('Address removed')
    setActionId(null)
  }

  // FIX: Save edited address
  const saveEditedAddress = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('addresses').update({
      full_name: editForm.full_name,
      phone: editForm.phone,
      address_line1: editForm.address_line1,
      address_line2: editForm.address_line2 || null,
      city: editForm.city,
      state: editForm.state,
      pincode: editForm.pincode,
    }).eq('id', id)
    if (error) { toast.error('Could not save address'); return }
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...editForm } : a))
    setEditingAddress(null)
    toast.success('Address updated!')
  }

  // ── Change password ──────────────────────────────────────────────────────
  const changePassword = async () => {
    setPassError('')
    setPassSuccess(false)

    // Validate current password is entered
    if (!currentPass) {
      setPassError('Please enter your current password.')
      return
    }
    // Validate new password length
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters.')
      return
    }
    // Validate passwords match
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.')
      return
    }
    // Prevent using same password
    if (currentPass === newPass) {
      setPassError('New password must be different from your current password.')
      return
    }

    setPassLoading(true)
    const supabase = createClient()

    // Step 1: Verify current password by re-signing in
    // This is the safest way to confirm they know their current password.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPass,
    })
    if (signInError) {
      setPassError('Current password is incorrect.')
      setPassLoading(false)
      return
    }

    // Step 2: Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPass,
    })
    if (updateError) {
      setPassError(updateError.message || 'Failed to update password. Please try again.')
      setPassLoading(false)
      return
    }

    // Success — clear the form
    setCurrentPass('')
    setNewPass('')
    setConfirmPass('')
    setPassSuccess(true)
    setPassLoading(false)
    toast.success('Password updated successfully!')
  }

  if (loading) return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      <div className="skeleton h-4 w-16 rounded mb-6" />
      <div className="skeleton h-8 w-32 rounded mb-8" />
      <div className="flex gap-4 mb-6 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-4 w-28 rounded" />
      </div>
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i}>
            <div className="skeleton h-3 w-20 rounded mb-2" />
            <div className="skeleton h-11 w-full rounded" />
          </div>
        ))}
        <div className="skeleton h-11 w-36 rounded mt-2" />
      </div>
    </div>
  )

  return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      {/* FIX: safe back — if user opened profile directly (bookmark/email), back() goes
          to external sites. Check history length first, fall back to homepage. */}
      <button type="button" onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="section-heading mb-8">My Profile</h1>
      <div className="flex gap-4 mb-6 border-b profile-tabs" style={{ borderColor: 'var(--border)' }}>
        {(['profile', 'addresses'] as const).map(t => (
          <button type="button" key={t} onClick={() => setTab(t)}
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
              inputMode="tel"
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
          <button type="button" onClick={save} disabled={saving || !!phoneError} className="btn-primary flex items-center gap-2"
            style={{ opacity: saving || phoneError ? 0.6 : 1 }}>
            {saving && <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* ── Change Password section — hidden for Google users ── */}
          {!isGoogleUser && (
            <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Lock size={15} style={{ color: 'var(--crimson)' }} />
                <h2 className="text-sm font-semibold tracking-widest uppercase"
                  style={{ color: 'var(--text-primary)' }}>Change Password</h2>
              </div>

              {/* Current password */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      className="input-base pr-10"
                      value={currentPass}
                      onChange={e => { setCurrentPass(e.target.value); setPassError(''); setPassSuccess(false) }}
                      autoComplete="current-password"
                      placeholder="Enter your current password"
                    />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}
                      aria-label={showCurrentPass ? 'Hide current password' : 'Show current password'}
                      onClick={() => setShowCurrentPass(v => !v)}>
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    New Password <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(min. 8 characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="input-base pr-10"
                      value={newPass}
                      onChange={e => { setNewPass(e.target.value); setPassError(''); setPassSuccess(false) }}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                    />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}
                      aria-label={showNewPass ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPass(v => !v)}>
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {newPass.length > 0 && (
                    <div className="flex items-center gap-2 mt-2" role="meter" aria-label="Password strength">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map(level => (
                          <div key={level} className="h-1 flex-1 rounded-full transition-colors"
                            style={{ background: newPass.length >= level * 2
                              ? level <= 1 ? '#EF4444'
                              : level <= 2 ? '#F59E0B'
                              : level <= 3 ? '#3B82F6'
                              : '#10B981'
                              : 'var(--border)' }} />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {newPass.length < 2 ? 'Too short'
                         : newPass.length < 4 ? 'Weak'
                         : newPass.length < 6 ? 'Fair'
                         : newPass.length < 8 ? 'Good'
                         : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm new password */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      className="input-base pr-10"
                      value={confirmPass}
                      onChange={e => { setConfirmPass(e.target.value); setPassError(''); setPassSuccess(false) }}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      style={{ borderColor: confirmPass && confirmPass !== newPass ? 'var(--crimson)' : undefined }}
                    />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}
                      aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPass(v => !v)}>
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPass && confirmPass !== newPass && (
                    <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>Passwords do not match</p>
                  )}
                </div>

                {/* Error message */}
                {passError && (
                  <p className="text-sm px-3 py-2 rounded" style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    {passError}
                  </p>
                )}

                {/* Success message */}
                {passSuccess && (
                  <p className="text-sm px-3 py-2 rounded" style={{ color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    ✓ Password updated successfully!
                  </p>
                )}

                <button
                  type="button"
                  onClick={changePassword}
                  disabled={passLoading || !currentPass || !newPass || !confirmPass}
                  className="btn-primary flex items-center gap-2"
                  style={{ opacity: passLoading || !currentPass || !newPass || !confirmPass ? 0.6 : 1 }}>
                  {passLoading && (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'addresses' && (
        <div className="space-y-3">
          {addresses.length === 0 && (
            <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>No saved addresses. Add one at checkout.</p>
          )}
          {addresses.map(a => (
            <div key={a.id} className="border" style={{ borderColor: 'var(--border)', background: a.is_default ? 'var(--cream)' : 'white' }}>
              {editingAddress === a.id ? (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                      <input className="input-base" value={editForm.full_name || ''} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                      <input className="input-base" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} type="tel" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Address Line 1</label>
                    <input className="input-base" value={editForm.address_line1 || ''} onChange={e => setEditForm(f => ({ ...f, address_line1: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Address Line 2 (optional)</label>
                    <input className="input-base" value={editForm.address_line2 || ''} onChange={e => setEditForm(f => ({ ...f, address_line2: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 address-edit-grid-3">
                    <div className="city-field">
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>City</label>
                      <input className="input-base" autoComplete="address-level2" value={editForm.city || ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>State</label>
                      <input className="input-base" autoComplete="address-level1" value={editForm.state || ''} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Pincode</label>
                      <input className="input-base" autoComplete="postal-code" maxLength={6} value={editForm.pincode || ''} onChange={e => setEditForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g,'') }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEditedAddress(a.id)} className="btn-primary text-sm">Save</button>
                    <button type="button" onClick={() => setEditingAddress(null)} className="btn-outline text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="text-sm">
                    <p className="font-medium">{a.full_name} · {a.phone}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{a.city}, {a.state} – {a.pincode}</p>
                    {a.is_default && <span className="text-xs mt-1 inline-block" style={{ color: 'var(--gold)' }}>✓ Default</span>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* FIX: Edit button */}
                    <button type="button" onClick={() => { setEditingAddress(a.id); setEditForm({ full_name: a.full_name, phone: a.phone, address_line1: a.address_line1, address_line2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode }) }} className="text-xs" style={{ color: 'var(--crimson)' }}>Edit</button>
                    {!a.is_default && <button type="button" onClick={() => setDefault(a.id)} disabled={actionId === a.id} className="text-xs disabled:opacity-40" style={{ color: 'var(--text-secondary)' }}>Set Default</button>}
                    <button type="button" onClick={() => remove(a.id)} disabled={actionId === a.id} className="text-xs disabled:opacity-40" style={{ color: 'var(--text-secondary)' }}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
