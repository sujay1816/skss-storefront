'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Package, MapPin, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: o } = await supabase.from('orders').select('*').eq('id', id).eq('user_id', session.user.id).single()
      if (!o) { router.push('/orders'); return }
      setOrder(o)

      const { data: oi } = await supabase.from('order_items').select('*').eq('order_id', id)
      setItems(oi || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="page-container py-20 text-center">
      <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!order) return null

  const addr = order.address_snapshot || order.shipping_address || {}
  const statusColors: Record<string, string> = {
    confirmed: '#16A34A', processing: '#2563EB', shipped: '#7C3AED',
    delivered: '#16A34A', cancelled: '#DC2626', pending: '#D97706'
  }

  return (
    <div className="page-container py-8 max-w-2xl">
      {/* Success banner */}
      <div className="rounded-xl p-6 mb-8 text-center" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1px solid #BBF7D0' }}>
        <CheckCircle size={48} className="mx-auto mb-3" style={{ color: '#16A34A' }} />
        <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: '#15803D' }}>
          Order Confirmed! 🎉
        </h1>
        <p className="text-sm" style={{ color: '#166534' }}>
          Thank you for shopping with Sai Krishna Silks & Sarees
        </p>
        <p className="text-xs mt-2 font-mono" style={{ color: '#16A34A' }}>
          Order ID: {order.id?.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Order Items */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          <Package size={18} style={{ color: 'var(--crimson)' }} /> Items Ordered
        </h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
              {item.product_image && (
                <img src={item.product_image} alt={item.product_name} className="w-16 h-18 object-cover rounded flex-shrink-0" style={{ height: 72 }} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.product_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.colour} · Qty: {item.quantity}</p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--crimson)' }}>
                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Price Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
            <span style={{ color: Number(order.shipping_charge) === 0 ? '#16A34A' : 'inherit' }}>
              {Number(order.shipping_charge) === 0 ? 'FREE' : `₹${Number(order.shipping_charge).toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>GST (5%)</span>
            <span>₹{Number(order.total_gst || order.gst_amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            <span>Total Paid</span>
            <span style={{ color: 'var(--crimson)' }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          <MapPin size={18} style={{ color: 'var(--crimson)' }} /> Delivery Address
        </h2>
        <div className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{addr.full_name}</p>
          <p>{addr.phone}</p>
          <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
          <p>{addr.city}, {addr.state} – {addr.pincode}</p>
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          <CreditCard size={18} style={{ color: 'var(--crimson)' }} /> Payment Details
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Method</span>
          <span className="capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
          <span className="font-semibold capitalize px-2 py-0.5 rounded-full text-xs text-white"
            style={{ background: statusColors[order.payment_status] || '#6B7280' }}>
            {order.payment_status}
          </span>
        </div>
        {order.razorpay_payment_id && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span style={{ color: 'var(--text-secondary)' }}>Payment ID</span>
            <span className="font-mono text-xs">{order.razorpay_payment_id}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/orders" className="btn-outline flex items-center gap-2 flex-1 justify-center">
          <ArrowLeft size={14} /> My Orders
        </Link>
        <Link href="/shop" className="btn-primary flex-1 justify-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
