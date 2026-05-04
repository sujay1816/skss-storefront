'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Check, MapPin, CreditCard, ShoppingBag, Plus, Edit2, Smartphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice } from '@/lib/utils'
import { INDIAN_STATES } from '@/lib/utils'
import type { Address } from '@/types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'

type Step = 'address' | 'payment' | 'confirm'

const FREE_SHIPPING = 1999
const SHIPPING_CHARGE = 99
const GST_RATE = 5

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const [step, setStep] = useState<Step>('address')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'razorpay'>('razorpay')
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [codEnabled, setCodEnabled] = useState(true)
  const [upiEnabled, setUpiEnabled] = useState(true)
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/checkout'); return }
      setUser(user)
      const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
      if (addrs && addrs.length > 0) {
        setAddresses(addrs.map((a: any) => ({ id: a.id, userId: a.user_id, fullName: a.full_name, phone: a.phone, addressLine1: a.address_line1, addressLine2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode, isDefault: a.is_default })))
        setSelectedAddress({ id: addrs[0].id, userId: addrs[0].user_id, fullName: addrs[0].full_name, phone: addrs[0].phone, addressLine1: addrs[0].address_line1, addressLine2: addrs[0].address_line2 || '', city: addrs[0].city, state: addrs[0].state, pincode: addrs[0].pincode, isDefault: addrs[0].is_default })
      } else { setShowNewAddress(true) }
      const { data: cfg } = await supabase.from('site_config').select('key, value').in('key', ['cod_enabled', 'upi_enabled'])
      if (cfg) {
        cfg.forEach((c: any) => {
          if (c.key === 'cod_enabled') setCodEnabled(c.value === 'true')
          if (c.key === 'upi_enabled') setUpiEnabled(c.value === 'true')
        })
      }
    }
    init()
  }, [])

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--ivory)' }}>
      <ShoppingBag size={48} className="mb-4" style={{ color: 'var(--border)' }} />
      <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Your cart is empty</h2>
      <Link href="/shop" className="btn-primary mt-4">Shop Now</Link>
    </div>
  )

  const subtotal = items.reduce((s, i) => s + (i.salePrice ?? i.originalPrice) * i.quantity, 0)
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_CHARGE
  const gst = Math.round((subtotal - couponDiscount) * GST_RATE / 100)
  const total = subtotal - couponDiscount + shipping + gst

  const saveAddress = async () => {
    const f = addressForm
    if (!f.fullName || !f.phone || !f.addressLine1 || !f.city || !f.state || !f.pincode) { toast.error('Please fill all required fields'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('addresses').insert({ user_id: user.id, full_name: f.fullName, phone: f.phone, address_line1: f.addressLine1, address_line2: f.addressLine2, city: f.city, state: f.state, pincode: f.pincode, is_default: addresses.length === 0 }).select().single()
    if (error) { toast.error('Could not save address'); return }
    const addr: Address = { id: data.id, userId: data.user_id, fullName: data.full_name, phone: data.phone, addressLine1: data.address_line1, addressLine2: data.address_line2 || '', city: data.city, state: data.state, pincode: data.pincode, isDefault: data.is_default }
    setAddresses(prev => [...prev, addr]); setSelectedAddress(addr); setShowNewAddress(false)
    setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })
  }

  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return }
    setLoading(true)
    const supabase = createClient()
    try {
      const orderPayload = {
        user_id: user.id,
        address_snapshot: selectedAddress,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        coupon_code: couponCode || null,
        coupon_discount: couponDiscount,
        subtotal, shipping_charge: shipping, total_gst: gst, total_amount: total,
        status: 'placed',
      }
      if (paymentMethod === 'razorpay') {
        const res = await fetch('/api/razorpay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total, currency: 'INR' }) })
        const rzData = await res.json()
        const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; document.body.appendChild(script)
        await new Promise(r => script.onload = r)
        const rzp = new window.Razorpay({
          key: rzData.key, amount: rzData.amount, currency: 'INR', name: 'Sai Krishna Silks and Sarees', description: 'Order Payment',
          image: '/images/logo.png', order_id: rzData.orderId,
          handler: async (response: any) => {
            const { data: order } = await supabase.from('orders').insert({ ...orderPayload, razorpay_order_id: rzData.orderId, razorpay_payment_id: response.razorpay_payment_id, payment_status: 'paid' }).select().single()
            await insertOrderItems(supabase, order.id)
            clearCart(); router.push(`/orders?success=${order.id}`)
          },
          prefill: { name: selectedAddress.fullName, contact: selectedAddress.phone },
          theme: { color: '#8B1A2B' }
        })
        rzp.open(); setLoading(false); return
      }
      const { data: order } = await supabase.from('orders').insert(orderPayload).select().single()
      await insertOrderItems(supabase, order.id)
      clearCart(); router.push(`/orders?success=${order.id}`)
    } catch (e) { toast.error('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const insertOrderItems = async (supabase: any, orderId: string) => {
    const orderItems = items.map(item => ({
      order_id: orderId, product_id: item.productId, product_name: item.productName, product_image: item.productImage,
      colour: item.colour, quantity: item.quantity, original_price: item.originalPrice, sale_price: item.salePrice,
      gst_rate: item.gstRate, gst_amount: Math.round((item.salePrice ?? item.originalPrice) * item.gstRate / 100 * item.quantity),
      total: (item.salePrice ?? item.originalPrice) * item.quantity,
    }))
    await supabase.from('order_items').insert(orderItems)
    // Decrement stock
    for (const item of items) {
      const { data: variant } = await supabase.from('product_variants').select('id, stock').eq('product_id', item.productId).eq('colour', item.colour).single()
      if (variant) await supabase.from('product_variants').update({ stock: Math.max(0, variant.stock - item.quantity) }).eq('id', variant.id)
    }
  }

  const steps: Step[] = ['address', 'payment', 'confirm']
  const stepLabels = { address: 'Delivery', payment: 'Payment', confirm: 'Review' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <div className="page-container py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10 max-w-md mx-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                  style={{ background: step === s ? 'var(--crimson)' : steps.indexOf(step) > i ? 'var(--gold)' : 'var(--border)', color: steps.indexOf(step) >= i ? 'white' : 'var(--text-secondary)' }}>
                  {steps.indexOf(step) > i ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-xs mt-1 tracking-wide" style={{ color: step === s ? 'var(--crimson)' : 'var(--text-secondary)' }}>{stepLabels[s]}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px mb-4" style={{ background: steps.indexOf(step) > i ? 'var(--gold)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left */}
          <div className="flex-1">
            {/* Step 1: Address */}
            <AnimatePresence mode="wait">
              {step === 'address' && (
                <motion.div key="address" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <h2 className="text-2xl font-light mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Delivery Address</h2>
                  {addresses.map(addr => (
                    <div key={addr.id} onClick={() => setSelectedAddress(addr)}
                      className="p-4 border mb-3 cursor-pointer transition-all"
                      style={{ borderColor: selectedAddress?.id === addr.id ? 'var(--crimson)' : 'var(--border)', background: selectedAddress?.id === addr.id ? 'var(--cream)' : 'white' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ borderColor: selectedAddress?.id === addr.id ? 'var(--crimson)' : 'var(--border)' }}>
                          {selectedAddress?.id === addr.id && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--crimson)' }} />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{addr.fullName} · {addr.phone}</p>
                          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{addr.city}, {addr.state} – {addr.pincode}</p>
                          {addr.isDefault && <span className="text-xs mt-1 inline-block px-2 py-0.5" style={{ background: 'var(--cream)', color: 'var(--gold)', border: '1px solid var(--gold)' }}>Default</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowNewAddress(!showNewAddress)} className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--crimson)' }}>
                    <Plus size={16} /> Add New Address
                  </button>
                  <AnimatePresence>
                    {showNewAddress && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border p-5 mb-4 grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
                          {[['fullName', 'Full Name *', 'col-span-1'], ['phone', 'Phone *', 'col-span-1'], ['addressLine1', 'Address Line 1 *', 'col-span-2'], ['addressLine2', 'Address Line 2', 'col-span-2'], ['city', 'City *', 'col-span-1'], ['pincode', 'Pincode *', 'col-span-1']].map(([key, label, cls]) => (
                            <div key={key} className={cls}>
                              <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                              <input className="input-base" value={(addressForm as any)[key]} onChange={e => setAddressForm(prev => ({ ...prev, [key]: e.target.value }))} />
                            </div>
                          ))}
                          <div className="col-span-2">
                            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>State *</label>
                            <select className="input-base" value={addressForm.state} onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}>
                              <option value="">Select State</option>
                              {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2 flex gap-3">
                            <button onClick={saveAddress} className="btn-primary">Save Address</button>
                            <button onClick={() => setShowNewAddress(false)} className="btn-outline">Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button onClick={() => { if (!selectedAddress) { toast.error('Please select an address'); return }; setStep('payment') }} className="btn-primary w-full justify-center mt-4">
                    Continue to Payment <ChevronRight size={14} />
                  </button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div key="payment" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <h2 className="text-2xl font-light mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Payment Method</h2>
                  <div className="space-y-3 mb-6">
                    {[
                      { key: 'razorpay', icon: <CreditCard size={18} />, title: 'Credit / Debit Card', sub: 'Pay securely via Razorpay', enabled: true },
                      { key: 'upi', icon: <Smartphone size={18} />, title: 'UPI Payment', sub: 'Pay using any UPI app', enabled: upiEnabled },
                      { key: 'cod', icon: <ShoppingBag size={18} />, title: 'Cash on Delivery', sub: `₹${SHIPPING_CHARGE} extra charge may apply`, enabled: codEnabled },
                    ].filter(p => p.enabled).map(p => (
                      <div key={p.key} onClick={() => setPaymentMethod(p.key as any)}
                        className="p-4 border cursor-pointer transition-all flex items-center gap-4"
                        style={{ borderColor: paymentMethod === p.key ? 'var(--crimson)' : 'var(--border)', background: paymentMethod === p.key ? 'var(--cream)' : 'white' }}>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: paymentMethod === p.key ? 'var(--crimson)' : 'var(--border)' }}>
                          {paymentMethod === p.key && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--crimson)' }} />}
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <span style={{ color: 'var(--crimson)' }}>{p.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.sub}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('address')} className="btn-outline">← Back</button>
                    <button onClick={() => setStep('confirm')} className="btn-primary flex-1 justify-center">Review Order <ChevronRight size={14} /></button>
                  </div>
                </motion.div>
              )}

              {step === 'confirm' && (
                <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                  <h2 className="text-2xl font-light mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Review & Place Order</h2>
                  {/* Address */}
                  <div className="border p-4 mb-4 flex justify-between" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                    <div><p className="text-xs font-semibold tracking-widest uppercase mb-1">Delivering to</p><p className="text-sm">{selectedAddress?.fullName} · {selectedAddress?.phone}</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedAddress?.addressLine1}, {selectedAddress?.city}, {selectedAddress?.state} – {selectedAddress?.pincode}</p></div>
                    <button onClick={() => setStep('address')} style={{ color: 'var(--crimson)' }}><Edit2 size={14} /></button>
                  </div>
                  {/* Payment */}
                  <div className="border p-4 mb-4 flex justify-between" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                    <div><p className="text-xs font-semibold tracking-widest uppercase mb-1">Payment</p><p className="text-sm capitalize">{paymentMethod === 'razorpay' ? 'Card / Online' : paymentMethod.toUpperCase()}</p></div>
                    <button onClick={() => setStep('payment')} style={{ color: 'var(--crimson)' }}><Edit2 size={14} /></button>
                  </div>
                  {/* Items */}
                  <div className="border p-4 mb-6 space-y-3" style={{ borderColor: 'var(--border)' }}>
                    {items.map(i => (
                      <div key={`${i.productId}-${i.colour}`} className="flex items-center gap-3">
                        <div className="w-12 h-16 flex-shrink-0 border overflow-hidden" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                          {i.productImage ? <Image src={i.productImage} alt={i.productName} width={48} height={64} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: i.colourHex, opacity: 0.5 }} />}
                        </div>
                        <div className="flex-1 text-sm"><p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{i.productName}</p><p style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{i.colour} · Qty {i.quantity}</p></div>
                        <span className="text-sm font-medium" style={{ color: 'var(--crimson)' }}>{formatPrice((i.salePrice ?? i.originalPrice) * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep('payment')} className="btn-outline">← Back</button>
                    <button onClick={placeOrder} disabled={loading} className="btn-primary flex-1 justify-center" style={{ fontSize: 13 }}>
                      {loading ? 'Placing Order...' : `Place Order · ${formatPrice(total)}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="border p-5 sticky top-24" style={{ borderColor: 'var(--border)', background: 'white' }}>
              <h3 className="text-lg font-light mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Order Summary</h3>
              <div className="space-y-2 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                {items.map(i => (
                  <div key={`${i.productId}-${i.colour}`} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>{i.productName} × {i.quantity}</span>
                    <span>{formatPrice((i.salePrice ?? i.originalPrice) * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between"><span style={{ color: '#1B7A3E' }}>Discount</span><span style={{ color: '#1B7A3E' }}>−{formatPrice(couponDiscount)}</span></div>}
                <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Shipping</span><span style={{ color: shipping === 0 ? '#1B7A3E' : 'inherit' }}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>GST</span><span>{formatPrice(gst)}</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t text-base" style={{ borderColor: 'var(--border)' }}>
                  <span>Total</span><span style={{ color: 'var(--crimson)', fontFamily: 'var(--font-heading)' }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
