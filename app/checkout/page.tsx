'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { INDIAN_STATES } from '@/lib/utils'  // FIX #10: import from shared utils (was re-declared locally with 4 missing states)
import toast from 'react-hot-toast'
import Image from 'next/image'

declare global { interface Window { Razorpay: any } }

const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
      {label} {required && <span style={{ color: 'var(--crimson)' }}>*</span>}
    </label>
    {children}
  </div>
)

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart, appliedCoupon, couponDiscount } = useCartStore()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')
  const [isBusinessPurchase, setIsBusinessPurchase] = useState(false)
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftNote, setGiftNote] = useState('')
  const GIFT_WRAP_FEE = 99
  const [gstin, setGstin] = useState('')
  const [gstinError, setGstinError] = useState('')
  const [form, setForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: 'Karnataka', pincode: '', saveAddress: true,
  })
  const [phoneError, setPhoneError] = useState('')
  // UI/UX: saved address selector
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [showAddressPicker, setShowAddressPicker] = useState(false)

  // FIX #3: read shipping threshold and GST rate from site_config instead of hardcoding
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1999)
  const [defaultShippingCharge, setDefaultShippingCharge] = useState(99)
  const [defaultGstRate, setDefaultGstRate] = useState(5)
  // FIX: order number prefix from site_config — falls back to NEXT_PUBLIC_BRAND_SHORT_NAME then 'ORD'
  const [orderPrefix, setOrderPrefix] = useState(process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || 'ORD')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      // FIX #7: use getUser() instead of getSession() for server-validated auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/checkout'); return }
      setUserId(user.id)
      setEmail(user.email || '')
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
      if (profile) setForm(f => ({ ...f, fullName: profile.full_name || '', phone: profile.phone || '' }))
      const { data: addr } = await supabase.from('addresses').select('*').eq('user_id', user.id).eq('is_default', true).single()
      if (addr) setForm(f => ({ ...f, fullName: addr.full_name || f.fullName, phone: addr.phone || f.phone, addressLine1: addr.address_line1, addressLine2: addr.address_line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode }))
      // UI/UX: load all saved addresses for the picker
      const { data: allAddrs } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
      setSavedAddresses(allAddrs || [])

      // FIX #3: fetch config values
      const { data: cfg } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', ['free_shipping_above', 'default_shipping_charge', 'default_gst_rate', 'brand_short_name'])
      if (cfg) {
        cfg.forEach((r: any) => {
          if (r.key === 'free_shipping_above') setFreeShippingThreshold(Number(r.value) || 1999)
          if (r.key === 'default_shipping_charge') setDefaultShippingCharge(Number(r.value) || 99)
          if (r.key === 'default_gst_rate') setDefaultGstRate(Number(r.value) || 5)
          // FIX: read brand_short_name to use as order number prefix
          if (r.key === 'brand_short_name' && r.value?.trim()) setOrderPrefix(r.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
        })
      }
    }
    load()
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/[\s\-\(\)]/g, '')
    const pattern = /^(\+91|91)?[6-9]\d{9}$/
    return pattern.test(clean)
  }

  const validateGSTIN = (g: string) =>
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g.trim().toUpperCase())

  const handlePhoneChange = (val: string) => {
    setForm(f => ({ ...f, phone: val }))
    if (val && !validatePhone(val)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number')
    } else {
      setPhoneError('')
    }
  }

  const sub = subtotal()
  const discount = couponDiscount()
  const freeShipping = appliedCoupon?.type === 'free_shipping'
  // FIX #3: use dynamic values from site_config instead of hardcoded 1999 / 99 / 0.05
  const shipping = freeShipping || sub >= freeShippingThreshold ? 0 : defaultShippingCharge
  const gstRate = defaultGstRate
  const gst = Math.round((sub - discount) * (gstRate / 100))
  // FIX #5: cap total at 0 — a large flat coupon could make total negative
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0
  const total = Math.max(0, sub - discount + shipping + gst + giftWrapFee)

  // FIX #4: stock check BEFORE opening Razorpay modal (quick pre-check only)
  // The actual atomic stock deduction happens server-side in /api/place-order
  const checkStockAvailability = async (supabase: any): Promise<boolean> => {
    for (const item of items) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('product_id', item.productId)
        .eq('colour', item.colour)
        .single()
      if (!variant || variant.stock < item.quantity) {
        toast.error(`Sorry, "${item.productName} (${item.colour})" is out of stock.`)
        return false
      }
    }
    return true
  }

  const createOrder = async () => {
    if (!userId) return
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.pincode) {
      toast.error('Please fill all required fields'); return
    }
    if (!validatePhone(form.phone)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number')
      toast.error('Please enter a valid phone number')
      return
    }
    if (isBusinessPurchase && gstin && !validateGSTIN(gstin)) {
      setGstinError('Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)')
      toast.error('Please enter a valid GSTIN')
      return
    }
    if (form.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode'); return
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    setLoading(true)

    try {
      const supabase = createClient()

      // Pre-check stock (non-locking, fast UI feedback)
      const stockOk = await checkStockAvailability(supabase)
      if (!stockOk) { setLoading(false); return }

      // Save address if requested
      if (form.saveAddress) {
        const { data: existing } = await supabase.from('addresses').select('id').eq('user_id', userId).eq('address_line1', form.addressLine1).eq('city', form.city).eq('pincode', form.pincode).maybeSingle()
        if (!existing) {
          await supabase.from('addresses').insert({
            user_id: userId, full_name: form.fullName, phone: form.phone,
            address_line1: form.addressLine1, address_line2: form.addressLine2,
            city: form.city, state: form.state, pincode: form.pincode, is_default: false,
          })
        }
      }

      if (paymentMethod === 'cod') {
        await placeOrder(null, null); return
      }

      const receipt = `order_${Date.now()}`
      const { data: { session: currentSession } } = await supabase.auth.refreshSession()
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentSession?.access_token || ''}` },
        body: JSON.stringify({ clientAmount: total, receipt }),
      })
      const razorpayOrder = await res.json()
      if (razorpayOrder.error) { toast.error(razorpayOrder.error); setLoading(false); return }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: document.title.split(' – ')[0] || 'Our Store',
        description: `Order for ${items.length} item(s)`,
        image: (document.querySelector('link[rel="icon"]') as HTMLLinkElement)?.href || '',
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          const verify = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const { verified } = await verify.json()
          if (verified) {
            await placeOrder(razorpayOrder.id, response.razorpay_payment_id)
          } else {
            toast.error('Payment verification failed. Contact support.')
            setLoading(false)
          }
        },
        prefill: { name: form.fullName, email, contact: form.phone },
        theme: { color: '#8B1A2B' },
        modal: { ondismiss: () => setLoading(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        toast.error('Payment failed: ' + response.error.description)
        setLoading(false)
      })
      rzp.open()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const placeOrder = async (razorpayOrderId: string | null, razorpayPaymentId: string | null) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.refreshSession()
      // Use session email as the authoritative address — the email state variable
      // may still be '' if the getUser() useEffect hasn't resolved yet (race condition).
      const confirmedEmail = session?.user?.email || email
      const addressData = { full_name: form.fullName, phone: form.phone, address_line1: form.addressLine1, address_line2: form.addressLine2, city: form.city, state: form.state, pincode: form.pincode, gstin: isBusinessPurchase && gstin ? gstin.trim().toUpperCase() : null, gift_wrap: giftWrap, gift_note: giftNote.trim() || null, gift_wrap_fee: giftWrapFee }

      // Single atomic server call — handles stock lock, order creation, and stock deduction
      // in one Postgres transaction. Prevents overselling even with simultaneous orders.
      const res = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({
          items,
          addressData,
          paymentMethod,
          razorpayOrderId,
          razorpayPaymentId,
          subtotal: sub,
          shipping,
          gst,
          total,
          couponCode: appliedCoupon?.code || null,
          couponDiscount: discount || 0,
          orderPrefix,
        }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || 'Order creation failed')
        setLoading(false)
        return
      }

      // Send confirmation email (non-blocking) — pass full order data for rich email
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_confirmation',
          order: {
            id: result.orderId,
            total_amount: total,
            subtotal: sub,
            shipping_charge: shipping,
            total_gst: gst,
            coupon_code: appliedCoupon?.code || null,
            coupon_discount: discount || 0,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
            razorpay_payment_id: razorpayPaymentId || null,
            address_snapshot: {
              full_name: form.fullName,
              phone: form.phone,
              address_line1: form.addressLine1,
              address_line2: form.addressLine2 || '',
              city: form.city,
              state: form.state,
              pincode: form.pincode,
            },
          },
          items: items.map(item => ({
            product_name: item.productName,
            colour: item.colour,
            quantity: item.quantity,
            sale_price: item.salePrice ?? item.originalPrice,
            original_price: item.originalPrice,
            total: (item.salePrice ?? item.originalPrice) * item.quantity,
          })),
          customerEmail: confirmedEmail,
        }),
      }).catch(() => {})

      await clearCart(userId || undefined)
      toast.success(paymentMethod === 'cod' ? 'Order placed! Pay on delivery.' : 'Payment successful! Order confirmed.')
      router.push(`/orders/${result.orderId}?new=1`)
    } catch (error: any) {
      toast.error('Order creation failed: ' + error.message)
      setLoading(false)
    }
  }

  if (items.length === 0) return (
    <div className="page-container py-20 text-center">
      <p className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Your cart is empty</p>
      <button type="button" onClick={() => router.push('/shop')} className="btn-primary">Browse Collection</button>
    </div>
  )

  return (
    <div className="page-container py-8">
      <h1 className="section-heading mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Delivery Address</h2>
            {/* UI/UX: saved address picker */}
            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowAddressPicker(!showAddressPicker)}
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: 'var(--crimson)' }}>
                  {showAddressPicker ? '▲' : '▼'} {savedAddresses.length === 1 ? 'Use saved address' : `Choose from ${savedAddresses.length} saved addresses`}
                </button>
                {showAddressPicker && (
                  <div className="mt-2 border rounded space-y-0 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    {savedAddresses.map((a, i) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, fullName: a.full_name, phone: a.phone, addressLine1: a.address_line1, addressLine2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode }))
                          setShowAddressPicker(false)
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-gray-50 border-b last:border-0 min-h-[44px]"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        <span className="font-medium">{a.full_name}</span>
                        {a.is_default && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--cream)', color: 'var(--gold-dark)' }}>Default</span>}
                        <br />
                        <span style={{ color: 'var(--text-secondary)' }}>{a.address_line1}, {a.city} – {a.pincode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* FIX #5: grid-cols-1 on mobile, grid-cols-2 on sm+ so fields aren't squished */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 checkout-form-grid">
              <F label="Full Name" required>
                <input className="input-base" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="As on ID" autoComplete="name" />
              </F>
              <F label="Phone" required>
                <input
                  className="input-base"
                  value={form.phone}
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  type="tel"
                  style={{ borderColor: phoneError ? 'var(--crimson)' : undefined }}
                />
                {phoneError && <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>{phoneError}</p>}
              </F>
              <div className="col-span-2">
                <F label="Address Line 1" required>
                  <input className="input-base" value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} placeholder="House/Flat No, Street, Area" autoComplete="address-line1" />
                </F>
              </div>
              <div className="col-span-2">
                <F label="Address Line 2">
                  <input className="input-base" value={form.addressLine2} onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))} placeholder="Landmark (optional)" autoComplete="address-line2" />
                </F>
              </div>
              <F label="City" required>
                <input className="input-base" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" autoComplete="address-level2" />
              </F>
              <F label="Pincode" required>
                <input
                  className="input-base"
                  value={form.pincode}
                  onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                  placeholder="6-digit pincode" autoComplete="postal-code"
                  inputMode="numeric" pattern="[0-9]*"
                  maxLength={6}
                  type="tel"
                />
              </F>
              <div className="col-span-2">
                <F label="State" required>
                  <select className="input-base" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" checked={form.saveAddress} onChange={e => setForm(f => ({ ...f, saveAddress: e.target.checked }))} style={{ accentColor: 'var(--crimson)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Save this address for future orders</span>
            </label>

            {/* GST Invoice — optional, only shown when business purchase ticked */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={isBusinessPurchase}
                  onChange={e => { setIsBusinessPurchase(e.target.checked); setGstin(''); setGstinError('') }}
                  style={{ accentColor: 'var(--crimson)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  This is a business purchase — I need a GST invoice
                </span>
              </label>
              {isBusinessPurchase && (
                <div>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => { setGstin(e.target.value.toUpperCase()); setGstinError('') }}
                    placeholder="GSTIN (e.g. 22AAAAA0000A1Z5)"
                    className="input-base w-full"
                    maxLength={15}
                    style={{ borderColor: gstinError ? 'var(--crimson)' : undefined, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    aria-label="GSTIN number"
                    autoComplete="off"
                  />
                  {gstinError && <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>{gstinError}</p>}
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Your GSTIN will appear on the invoice PDF. Leave blank if not needed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Gift Wrap option */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">🎁</span>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Gift Wrapping</h2>
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-colors"
              style={{ borderColor: giftWrap ? 'var(--crimson)' : 'var(--border)', background: giftWrap ? 'var(--cream)' : 'transparent' }}>
              <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)}
                className="mt-0.5 flex-shrink-0" style={{ accentColor: 'var(--crimson)' }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Add gift wrapping</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--crimson)' }}>+₹{GIFT_WRAP_FEE}</p>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Premium wrapping with a ribbon — perfect for gifting</p>
              </div>
            </label>
            {giftWrap && (
              <div className="mt-3">
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  Gift message <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional, max 150 characters)</span>
                </label>
                <textarea
                  value={giftNote}
                  onChange={e => setGiftNote(e.target.value.slice(0, 150))}
                  placeholder="e.g. Happy Birthday! Wishing you joy and elegance always."
                  className="input-base w-full"
                  rows={3}
                  style={{ resize: 'none', fontSize: 13 }}
                />
                <p className="text-xs text-right mt-1" style={{ color: giftNote.length >= 140 ? 'var(--crimson)' : 'var(--text-secondary)' }}>
                  {giftNote.length}/150
                </p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Payment Method</h2>
            <div className="space-y-3">
              {[
                { id: 'online', label: 'Pay Online', sub: 'UPI, Cards, Net Banking via Razorpay', icon: '💳' },
                { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
              ].map(method => (
                <label key={method.id} className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all"
                  style={{ borderColor: paymentMethod === method.id ? 'var(--crimson)' : 'var(--border)', background: paymentMethod === method.id ? 'var(--cream)' : 'white' }}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id as any)} style={{ accentColor: 'var(--crimson)' }} />
                  <span className="text-xl">{method.icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{method.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{method.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Order Summary</h2>
              <a href="/cart" className="text-xs" style={{ color: 'var(--crimson)' }}>Edit Cart →</a>
            </div>
            <div className="space-y-3 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  {item.productImage && (
                    <div className="relative w-14 h-16 flex-shrink-0 overflow-hidden rounded">
                      <Image src={item.productImage} alt={item.productName || ''} fill sizes="56px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.productName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.colour} · Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--crimson)', fontFamily: 'var(--font-body)' }}>₹{((item.salePrice ?? item.originalPrice) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>₹{sub.toLocaleString('en-IN')}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span style={{ color: '#16A34A' }}>Coupon ({appliedCoupon?.code})</span><span style={{ color: '#16A34A' }}>−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Shipping</span><span style={{ color: shipping === 0 ? '#16A34A' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              {giftWrap && (
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>🎁 Gift Wrap</span><span>₹{GIFT_WRAP_FEE}</span></div>
              )}
              {/* FIX #3: show dynamic GST rate */}
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>GST ({gstRate}%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span>Total</span><span style={{ color: 'var(--crimson)', fontFamily: 'var(--font-body)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {/* Trust seals — only real facts, above the payment button */}
            <div className="flex items-center justify-center gap-4 mt-4 mb-3 py-2.5 rounded"
              style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>🔒 Secure</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>✅ 100% Authentic</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>↩️ Easy Returns</span>
            </div>
            <button type="button" onClick={createOrder} disabled={loading || !!phoneError}
              className="btn-primary w-full justify-center"
              style={{ opacity: loading || phoneError ? 0.7 : 1 }}>
              {loading
                ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                : paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>🔒 Secured by Razorpay · 256-bit SSL</p>
          </div>
        </div>
      </div>
    </div>
  )
}
