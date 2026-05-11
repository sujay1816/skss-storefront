'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const FREE_SHIPPING = 1999
const SHIPPING_CHARGE = 99
const GST_RATE = 5

export default function CartPage() {
  const { items, removeItem, updateQty, setCoupon: setStoreCoupon, appliedCoupon: storedCoupon } = useCartStore()
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; discount: number; type: string }>(storedCoupon)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
    })
  }, [])
  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true); setCouponError('')
    const supabase = createClient()

    // Get current user
    const { data: { session } } = await supabase.auth.getSession()

    // Fetch coupon
    const { data } = await supabase.from('coupons').select('*').eq('code', coupon.toUpperCase()).eq('is_active', true).single()
    if (!data) { setCouponError('Invalid or expired coupon code'); setCouponLoading(false); return }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) { setCouponError('This coupon has expired'); setCouponLoading(false); return }
    if (data.usage_count >= data.max_usage_count) { setCouponError('This coupon has reached its usage limit'); setCouponLoading(false); return }

    // Check per-user usage limit
    if (session?.user && data.per_user_limit) {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('coupon_code', data.code)
      if ((count || 0) >= data.per_user_limit) {
        setCouponError('You have already used this coupon the maximum number of times')
        setCouponLoading(false); return
      }
    }

    const couponData = { code: data.code, discount: data.value, type: data.type }
    setAppliedCoupon(couponData)
    setStoreCoupon(couponData)
    toast.success(`Coupon applied! You save ${data.type === 'percentage' ? data.value + '%' : '₹' + data.value}`)
    setCoupon(''); setCouponLoading(false)
  }
  const subtotal = items.reduce((s, i) => s + (i.salePrice ?? i.originalPrice) * i.quantity, 0)
  const couponDiscount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? Math.round(subtotal * appliedCoupon.discount / 100) : appliedCoupon.type === 'free_shipping' ? 0 : appliedCoupon.discount) : 0
  const freeShipping = appliedCoupon?.type === 'free_shipping'
  const shipping = freeShipping || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_CHARGE
  const gst = Math.round((subtotal - couponDiscount) * GST_RATE / 100)
  const total = subtotal - couponDiscount + shipping + gst
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--ivory)' }}>
      <ShoppingBag size={64} className="mb-6" style={{ color: 'var(--border)' }} />
      <h2 className="text-3xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Your cart is empty</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Discover beautiful sarees and add them to your cart.</p>
      <Link href="/shop" className="btn-primary">Shop Now <ArrowRight size={14} /></Link>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <div className="page-container py-8">
        <h1 className="section-heading mb-8">Shopping Cart <span className="text-base font-normal ml-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>({totalItems} items)</span></h1>

        {subtotal < FREE_SHIPPING && (
          <div className="mb-6 p-3 text-xs text-center border" style={{ borderColor: 'var(--gold)', background: 'var(--cream)', color: 'var(--text-secondary)' }}>
            Add <span className="font-semibold" style={{ color: 'var(--crimson)' }}>{formatPrice(FREE_SHIPPING - subtotal)}</span> more for free shipping!
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%`, background: 'var(--crimson)' }} />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items */}
          <div className="flex-1">
            <AnimatePresence>
              {items.map(item => {
                const price = item.salePrice ?? item.originalPrice
                const isOnSale = !!item.salePrice
                return (
                  <motion.div key={`${item.productId}-${item.colour}`} layout exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex gap-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-24 h-32 flex-shrink-0 border overflow-hidden" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} width={96} height={128} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: item.colourHex, opacity: 0.4 }}><span className="text-3xl">🥻</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productSlug}`}><h3 className="font-light mb-1 hover:underline" style={{ fontFamily: 'var(--font-heading)', fontSize: '16px' }}>{item.productName}</h3></Link>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Colour: <span style={{ color: 'var(--text-primary)' }}>{item.colour}</span></p>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center border" style={{ borderColor: 'var(--border)' }}>
                          <button onClick={() => updateQty(item.productId, item.colour, item.quantity - 1, userId || undefined)} className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--text-primary)' }}><Minus size={12} /></button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, item.colour, item.quantity + 1, userId || undefined)} disabled={item.quantity >= item.stock} className="w-8 h-8 flex items-center justify-center disabled:opacity-30" style={{ color: 'var(--text-primary)' }}><Plus size={12} /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium" style={{ color: 'var(--crimson)' }}>{formatPrice(price * item.quantity)}</p>
                            {isOnSale && <p className="text-xs line-through" style={{ color: 'var(--text-secondary)' }}>{formatPrice(item.originalPrice * item.quantity)}</p>}
                          </div>
                          <button onClick={() => { removeItem(item.productId, item.colour, userId || undefined); toast.success('Item removed') }} className="p-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div className="mt-4">
              <Link href="/shop" className="text-xs flex items-center gap-1" style={{ color: 'var(--crimson)' }}>← Continue Shopping</Link>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="border p-6 sticky top-24" style={{ borderColor: 'var(--border)', background: 'white' }}>
              <h2 className="text-xl font-light mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Order Summary</h2>
              {/* Coupon */}
              <div className="mb-5">
                <p className="text-xs font-medium tracking-wide uppercase mb-2" style={{ color: 'var(--text-primary)' }}>Coupon Code</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 border" style={{ borderColor: 'var(--gold)', background: 'var(--cream)' }}>
                    <div className="flex items-center gap-2"><Tag size={14} style={{ color: 'var(--gold)' }} /><span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{appliedCoupon.code}</span></div>
                    <button onClick={() => { setAppliedCoupon(null); setStoreCoupon(null) }} className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError('') }} placeholder="Enter code" className="input-base flex-1" style={{ height: 36, fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
                    <button onClick={applyCoupon} disabled={couponLoading} className="btn-outline flex-shrink-0" style={{ height: 36, padding: '0 12px', fontSize: 11 }}>Apply</button>
                  </div>
                )}
                {couponError && <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>{couponError}</p>}
              </div>
              {/* Price */}
              <div className="space-y-3 mb-5 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-sm"><span style={{ color: '#1B7A3E' }}>Coupon Discount</span><span style={{ color: '#1B7A3E' }}>−{formatPrice(couponDiscount)}</span></div>}
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Shipping</span><span style={{ color: shipping === 0 ? '#1B7A3E' : 'inherit' }}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>GST ({GST_RATE}%)</span><span>{formatPrice(gst)}</span></div>
              </div>
              <div className="flex justify-between font-medium mb-6">
                <span>Total</span><span className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)' }}>{formatPrice(total)}</span>
              </div>
              <Link href="/checkout" className="btn-primary w-full justify-center block text-center">Proceed to Checkout <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
