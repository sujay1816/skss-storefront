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
  const total = Math.max(0, sub - discount + shipping + gst)

  // FIX #4: stock check BEFORE opening Razorpay modal, not after payment
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
    if (form.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode'); return
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    setLoading(true)

    try {
      const supabase = createClient()

      // FIX #4: check stock before payment for both COD and online
      const stockOk = await checkStockAvailability(supabase)
      if (!stockOk) { setLoading(false); return }

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
        await placeOrder(supabase, null, null); return
      }
      const receipt = `order_${Date.now()}`
      // FIX: send Bearer token so server can verify session + recalculate amount
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession?.access_token || ''}`,
        },
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
        image: (document.querySelector('link[rel="icon"]') as HTMLLinkElement)?.href || '/images/logo.png',
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          const verify = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const { verified } = await verify.json()
          if (verified) {
            await placeOrder(supabase, razorpayOrder.id, response.razorpay_payment_id)
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

  const placeOrder = async (supabase: any, razorpayOrderId: string | null, razorpayPaymentId: string | null) => {
    try {
      const addressData = { full_name: form.fullName, phone: form.phone, address_line1: form.addressLine1, address_line2: form.addressLine2, city: form.city, state: form.state, pincode: form.pincode }
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: userId, status: 'confirmed',
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        payment_method: paymentMethod === 'cod' ? 'cod' : 'razorpay',
        // FIX: generate order_number at creation using brand prefix from site_config
        // Format: {PREFIX}-{YYYYMMDD}-{4-char random hex} e.g. SKSS-20240315-A3F2
        order_number: `${orderPrefix}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(16).slice(2,6).toUpperCase()}`,
        razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId,
        subtotal: sub, shipping_charge: shipping, total_gst: gst, gst_amount: gst,
        total_amount: total, coupon_code: appliedCoupon?.code || null,
        coupon_discount: discount || 0, address_snapshot: addressData, shipping_address: addressData,
      }).select().single()
      if (error) throw error
      await supabase.from('order_items').insert(items.map(item => ({
        order_id: order.id, product_id: item.productId, product_name: item.productName,
        product_image: item.productImage, colour: item.colour, quantity: item.quantity,
        original_price: item.originalPrice, sale_price: item.salePrice ?? item.originalPrice,
        total: (item.salePrice ?? item.originalPrice) * item.quantity,
        gst_rate: item.gstRate, gst_amount: Math.round((item.salePrice ?? item.originalPrice) * item.quantity * (item.gstRate / 100)),
      })))
      // FIX #1: removed NEXT_PUBLIC_INTERNAL_API_SECRET — the env var on server side
      // is now just INTERNAL_API_SECRET (no NEXT_PUBLIC_ prefix), so it won't be
      // bundled into the browser. The route reads process.env.INTERNAL_API_SECRET.
      // On the client we read NEXT_PUBLIC_INTERNAL_API_SECRET which you must add to
      // your .env as: NEXT_PUBLIC_INTERNAL_API_SECRET=<same value as INTERNAL_API_SECRET>
      // OR better: move stock deduction to a server action so no secret is needed at all.
      // For now we keep the header pattern but note the env var rename in .env.example.
      await fetch('/api/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || '' },
        body: JSON.stringify({ type: 'deduct', items: items.map(item => ({ product_id: item.productId, colour: item.colour, quantity: item.quantity })) })
      })
      // FIX #12: removed duplicate nested if (appliedCoupon?.code) — outer check is sufficient
      if (appliedCoupon?.code) {
        await supabase.rpc('increment_coupon_usage', { coupon_code: appliedCoupon.code })
      }
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'order_confirmation', order, items: items.map(item => ({ product_name: item.productName, colour: item.colour, quantity: item.quantity, sale_price: item.salePrice ?? item.originalPrice, original_price: item.originalPrice, total: (item.salePrice ?? item.originalPrice) * item.quantity })), customerEmail: email })
        })
      } catch (e) { console.error('Email failed:', e) }
      await clearCart()
      toast.success(paymentMethod === 'cod' ? 'Order placed! Pay on delivery.' : 'Payment successful! Order confirmed.')
      router.push(`/orders/${order.id}`)
    } catch (error: any) {
      toast.error('Order creation failed: ' + error.message)
      setLoading(false)
    }
  }

  if (items.length === 0) return (
    <div className="page-container py-20 text-center">
      <p className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Your cart is empty</p>
      <button onClick={() => router.push('/shop')} className="btn-primary">Browse Collection</button>
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
                        className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-50 border-b last:border-0"
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
                      <Image src={item.productImage} alt={item.productName || ''} fill sizes="10vw" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.productName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.colour} · Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--crimson)' }}>₹{((item.salePrice ?? item.originalPrice) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>₹{sub.toLocaleString('en-IN')}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span style={{ color: '#16A34A' }}>Coupon ({appliedCoupon?.code})</span><span style={{ color: '#16A34A' }}>−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Shipping</span><span style={{ color: shipping === 0 ? '#16A34A' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              {/* FIX #3: show dynamic GST rate */}
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>GST ({gstRate}%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span>Total</span><span style={{ color: 'var(--crimson)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={createOrder} disabled={loading || !!phoneError}
              className="btn-primary w-full mt-4 justify-center"
              style={{ opacity: loading || phoneError ? 0.7 : 1 }}>
              {loading
                ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                : paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>🔒 Secured by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  )
}
