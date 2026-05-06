'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import toast from 'react-hot-toast'
import Image from 'next/image'

declare global { interface Window { Razorpay: any } }

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry']

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')
  const [form, setForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: 'Karnataka', pincode: '', saveAddress: true,
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/checkout'); return }
      setUserId(session.user.id)
      setEmail(session.user.email || '')

      // Pre-fill from profile
      const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', session.user.id).single()
      if (profile) setForm(f => ({ ...f, fullName: profile.full_name || '', phone: profile.phone || '' }))

      // Pre-fill default address
      const { data: addr } = await supabase.from('addresses').select('*').eq('user_id', session.user.id).eq('is_default', true).single()
      if (addr) setForm(f => ({ ...f, fullName: addr.full_name || f.fullName, phone: addr.phone || f.phone, addressLine1: addr.address_line1, addressLine2: addr.address_line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode }))
    }
    load()
  }, [])

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const sub = subtotal()
  const shipping = sub >= 1999 ? 0 : 99
  const gst = Math.round(sub * 0.05)
  const total = sub + shipping + gst

  const createOrder = async () => {
    if (!userId) return
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.pincode) {
      toast.error('Please fill all required fields'); return
    }
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    setLoading(true)

    try {
      const supabase = createClient()

      // Save address if requested
      if (form.saveAddress) {
        await supabase.from('addresses').insert({
          user_id: userId, full_name: form.fullName, phone: form.phone,
          address_line1: form.addressLine1, address_line2: form.addressLine2,
          city: form.city, state: form.state, pincode: form.pincode, is_default: false,
        })
      }

      if (paymentMethod === 'cod') {
        // COD — create order directly
        await placeOrder(supabase, null, null)
        return
      }

      // Online payment — create Razorpay order
      const receipt = `order_${Date.now()}`
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, receipt }),
      })
      const razorpayOrder = await res.json()
      if (razorpayOrder.error) { toast.error(razorpayOrder.error); setLoading(false); return }

      // Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Sai Krishna Silks & Sarees',
        description: `Order for ${items.length} item(s)`,
        image: '/images/logo.png',
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          // Verify payment
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
      // Create order in DB
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: userId,
        status: 'confirmed',
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        payment_method: paymentMethod === 'cod' ? 'cod' : 'razorpay',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        subtotal: sub,
        shipping_charge: shipping,
        gst_amount: gst,
        total_amount: total,
        shipping_address: {
          full_name: form.fullName, phone: form.phone,
          address_line1: form.addressLine1, address_line2: form.addressLine2,
          city: form.city, state: form.state, pincode: form.pincode,
        },
      }).select().single()

      if (error) throw error

      // Create order items
      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          product_image: item.productImage,
          colour: item.colour,
          colour_hex: item.colourHex,
          quantity: item.quantity,
          unit_price: item.salePrice ?? item.originalPrice,
          total_price: (item.salePrice ?? item.originalPrice) * item.quantity,
          gst_rate: item.gstRate,
        }))
      )

      // Clear cart
      await clearCart()
      toast.success(paymentMethod === 'cod' ? 'Order placed! Pay on delivery.' : 'Payment successful! Order confirmed.')
      router.push(`/orders/${order.id}`)
    } catch (error: any) {
      toast.error('Order creation failed: ' + error.message)
      setLoading(false)
    }
  }

  const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--crimson)' }}>*</span>}
      </label>
      {children}
    </div>
  )

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
        {/* Left — Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Delivery Address</h2>
            <div className="grid grid-cols-2 gap-4">
              <F label="Full Name" required>
                <input className="input-base" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="As on ID" />
              </F>
              <F label="Phone" required>
                <input className="input-base" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
              </F>
              <div className="col-span-2">
                <F label="Address Line 1" required>
                  <input className="input-base" value={form.addressLine1} onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} placeholder="House/Flat No, Street, Area" />
                </F>
              </div>
              <div className="col-span-2">
                <F label="Address Line 2">
                  <input className="input-base" value={form.addressLine2} onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))} placeholder="Landmark (optional)" />
                </F>
              </div>
              <F label="City" required>
                <input className="input-base" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
              </F>
              <F label="Pincode" required>
                <input className="input-base" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit pincode" maxLength={6} />
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

          {/* Payment Method */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Payment Method</h2>
            <div className="space-y-3">
              {[
                { id: 'online', label: 'Pay Online', sub: 'UPI, Cards, Net Banking via Razorpay', icon: '💳' },
                { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
              ].map(method => (
                <label key={method.id} className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all"
                  style={{ borderColor: paymentMethod === method.id ? 'var(--crimson)' : 'var(--border)', background: paymentMethod === method.id ? 'var(--cream)' : 'white' }}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id as any)} style={{ accentColor: 'var(--crimson)' }} />
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

        {/* Right — Order Summary */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-24">
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontSize: 18 }}>Order Summary</h2>
            <div className="space-y-3 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName} className="w-14 h-16 object-cover rounded flex-shrink-0" />
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
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>₹{sub.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ color: shipping === 0 ? '#16A34A' : 'inherit' }}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>GST (5%)</span>
                <span>₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--crimson)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={createOrder} disabled={loading}
              className="btn-primary w-full mt-4 justify-center"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order (COD)' : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
              🔒 Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
