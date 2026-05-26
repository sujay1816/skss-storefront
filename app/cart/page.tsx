'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, removeItem, updateQty, setCoupon: setStoreCoupon, appliedCoupon: storedCoupon } = useCartStore()
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; discount: number; type: string }>(storedCoupon)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1999)
  const [shippingCharge, setShippingCharge] = useState(99)
  const [gstRate, setGstRate] = useState(5)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
    // Re-validate stock for all cart items on page load — catches items that sold out since adding
    if (items.length > 0) {
      const productIds = [...new Set(items.map(i => i.productId))]
      supabase.from('product_variants')
        .select('product_id, colour, stock')
        .in('product_id', productIds)
        .then(({ data }) => {
          if (!data) return
          items.forEach(item => {
            const live = data.find((v: any) => v.product_id === item.productId && v.colour === item.colour)
            if (live && live.stock !== item.stock) {
              updateQty(item.productId, item.colour, Math.min(item.quantity, live.stock))
            }
          })
        })
    }
    supabase.from('site_config')
      .select('key, value')
      .in('key', ['free_shipping_above', 'default_shipping_charge', 'default_gst_rate'])
      .then(({ data }) => {
        if (!data) return
        data.forEach((r: any) => {
          if (r.key === 'free_shipping_above') setFreeShippingThreshold(Number(r.value) || 1999)
          if (r.key === 'default_shipping_charge') setShippingCharge(Number(r.value) || 99)
          if (r.key === 'default_gst_rate') setGstRate(Number(r.value) || 5)
        })
      })
  }, [])

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true); setCouponError('')
    const supabase = createClient()

    // FIX #4: use getUser() for per-user limit check
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase.from('coupons').select('*').eq('code', coupon.toUpperCase()).eq('is_active', true).single()
    if (!data) { setCouponError('Invalid or expired coupon code'); setCouponLoading(false); return }
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) { setCouponError('This coupon has expired'); setCouponLoading(false); return }
    if (data.usage_count >= data.max_usage_count) { setCouponError('This coupon has reached its usage limit'); setCouponLoading(false); return }

    // FIX #3: check minimum order value before applying coupon
    if (data.min_order_value && subtotal < data.min_order_value) {
      setCouponError(`Minimum order of ${formatPrice(data.min_order_value)} required for this coupon`)
      setCouponLoading(false); return
    }

    // Check per-user usage limit
    if (user && data.per_user_limit) {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
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
  const isFreeShipping = appliedCoupon?.type === 'free_shipping'
  const shipping = isFreeShipping || subtotal >= freeShippingThreshold ? 0 : shippingCharge
  const gst = Math.round((subtotal - couponDiscount) * gstRate / 100)
  // FIX: cap coupon discount at subtotal (flat coupon > subtotal makes total negative)
  const effectiveDiscount = Math.min(couponDiscount, subtotal)
  const total = Math.max(0, subtotal - effectiveDiscount + shipping + gst)
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--ivory)' }}>
      <div className="empty-state-icon mb-6" style={{ width: 96, height: 96 }}>
        <ShoppingBag size={40} style={{ color: 'var(--crimson)', opacity: 0.5 }} />
      </div>
      <h2 className="text-3xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Your cart is empty</h2>
      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Looks like you haven't added anything yet.</p>
      <p className="text-xs mb-8" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>Discover our handpicked collection of pure silk sarees.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/shop" className="btn-primary">Browse Collection <ArrowRight size={14} /></Link>
        <Link href="/shop?filter=new" className="btn-outline">New Arrivals</Link>
        <Link href="/shop?filter=bestsellers" className="btn-outline">Bestsellers</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <div className="page-container py-8">
        <h1 className="section-heading mb-8">Shopping Cart <span className="text-base font-normal ml-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>({totalItems} items)</span></h1>

        {subtotal < freeShippingThreshold && (
          <div className="mb-6 p-3 text-xs text-center border" style={{ borderColor: 'var(--gold)', background: 'var(--cream)', color: 'var(--text-secondary)' }}>
            Add <span className="font-semibold" style={{ color: 'var(--crimson)' }}>{formatPrice(freeShippingThreshold - subtotal)}</span> more for free shipping!
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`, background: 'var(--crimson)' }} />
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
                    <div className="w-24 h-32 flex-shrink-0 border overflow-hidden cart-item-image" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                      {item.productImage ? (
                        <Image src={item.productImage} alt={item.productName} width={96} height={128} sizes="96px" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: item.colourHex, opacity: 0.4 }}><span className="text-3xl">🥻</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productSlug}`}><h3 className="font-light mb-1 hover:underline" style={{ fontFamily: 'var(--font-heading)', fontSize: '16px' }}>{item.productName}</h3></Link>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Colour: <span style={{ color: 'var(--text-primary)' }}>{item.colour}</span></p>
                      {item.stock <= 3 && item.stock > 0 && (
                        <p className="text-xs mb-2 font-medium" style={{ color: '#D97706' }}>⚠ Only {item.stock} left in stock</p>
                      )}
                      {item.stock === 0 && (
                        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--crimson)' }}>✕ Out of stock — please remove</p>
                      )}
                      {item.quantity >= item.stock && item.stock > 0 && (
                        <p className="text-xs mb-2" style={{ color: '#D97706' }}>Max quantity reached</p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center border" style={{ borderColor: 'var(--border)' }}>
                          {/* FIX #3: w-11 h-11 on mobile (44px touch target), w-8 h-8 on sm+ */}
                          <button type="button" disabled={updatingId === item.productId + item.colour} onClick={() => { setUpdatingId(item.productId + item.colour); updateQty(item.productId, item.colour, item.quantity - 1, userId || undefined) }} className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center" style={{ color: 'var(--text-primary)' }}><Minus size={16} /></button>
                          <span className="w-10 text-center font-medium" style={{ fontSize: 15 }}>{item.quantity}</span>
                          <button type="button" disabled={updatingId === item.productId + item.colour || item.quantity >= item.stock} onClick={() => { setUpdatingId(item.productId + item.colour); updateQty(item.productId, item.colour, item.quantity + 1, userId || undefined) }} className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center disabled:opacity-30" style={{ color: 'var(--text-primary)' }}><Plus size={16} /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium" style={{ color: 'var(--crimson)' }}>{formatPrice(price * item.quantity)}</p>
                            {isOnSale && <p className="text-xs line-through" style={{ color: 'var(--text-secondary)' }}>{formatPrice(item.originalPrice * item.quantity)}</p>}
                          </div>
                          <button type="button" disabled={updatingId === item.productId + item.colour} onClick={() => { setUpdatingId(item.productId + item.colour); removeItem(item.productId, item.colour, userId || undefined); toast.success('Item removed') }} aria-label="Remove item from cart" className="p-1" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div className="mt-4">
              <Link href="/shop" className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--crimson)' }}>← Continue Shopping</Link>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:w-80 flex-shrink-0 cart-summary-sticky">
            <div className="cart-receipt p-6 sticky top-24">
              <h2 className="text-xl font-light mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Order Summary</h2>
              <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              <div className="mb-5">
                <p className="text-xs font-medium tracking-wide uppercase mb-2" style={{ color: 'var(--text-primary)' }}>Coupon Code</p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 border" style={{ borderColor: 'var(--gold)', background: 'var(--cream)' }}>
                    <div className="flex items-center gap-2"><Tag size={14} style={{ color: 'var(--gold)' }} /><span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{appliedCoupon.code}</span></div>
                    <button type="button" onClick={() => { setAppliedCoupon(null); setStoreCoupon(null) }} className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" aria-label="Coupon code" value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError('') }} placeholder="Enter code" className="input-base flex-1" style={{ height: 36, fontSize: 13 }} onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
                    <button type="button" onClick={applyCoupon} disabled={couponLoading} className="btn-outline flex-shrink-0" style={{ height: 36, padding: '0 12px', fontSize: 11 }}>Apply</button>
                  </div>
                )}
                {couponError && <p className="text-xs mt-1" style={{ color: 'var(--crimson)' }}>{couponError}</p>}
              </div>
              <div className="space-y-3 mb-5 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {effectiveDiscount > 0 && <div className="flex justify-between text-sm"><span style={{ color: '#1B7A3E' }}>Coupon Discount</span><span style={{ color: '#1B7A3E' }}>−{formatPrice(effectiveDiscount)}</span></div>}
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Shipping</span><span style={{ color: shipping === 0 ? '#1B7A3E' : 'inherit' }}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>GST ({gstRate}%)</span><span>{formatPrice(gst)}</span></div>
              </div>
              <div className="cart-total-row">
                <span className="text-sm font-medium tracking-wide uppercase">Total</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 300 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 400 }}>₹</span>{total.toLocaleString('en-IN')}
                </span>
              </div>
              {total >= 3000 && (
                <p className="text-xs text-center mt-3 mb-1" style={{ color: '#1D4ED8', fontFamily: 'var(--font-body)' }}>
                  💳 EMI from ₹{Math.ceil(total / 6).toLocaleString('en-IN')}/month available at checkout
                </p>
              )}
              <Link href="/checkout" className="btn-primary w-full justify-center mt-4" style={{ display: 'flex' }}>
                Proceed to Checkout <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
