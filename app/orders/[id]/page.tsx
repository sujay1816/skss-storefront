'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, MapPin, CreditCard, ArrowLeft } from 'lucide-react'
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

      // Get order - verify it belongs to this user
      const { data: o } = await supabase
        .from('orders').select('*').eq('id', id).eq('user_id', session.user.id).single()
      if (!o) { router.push('/orders'); return }
      setOrder(o)

      // Fix #4 — use Supabase client directly instead of raw REST API
      // Raw REST was fragile and unnecessarily complex
      const { data: oi, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)
      if (itemsError) console.error('Order items error:', itemsError.message)
      setItems(oi || [])
      setLoading(false)
    }
    load()
  }, [id])

  const statusColors: Record<string, string> = {
    confirmed: '#16A34A', processing: '#2563EB', shipped: '#7C3AED',
    delivered: '#16A34A', cancelled: '#DC2626', pending: '#D97706'
  }

  if (loading) return (
    <div className="page-container py-20 text-center">
      <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!order) return null
  const addr = order.address_snapshot || order.shipping_address || {}

  return (
    <div className="page-container py-8 max-w-2xl">
      {(() => {
        const statusConfig: Record<string, { bg: string; border: string; icon: string; title: string; subtitle: string; color: string }> = {
          confirmed:        { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '✅', title: 'Order Confirmed!',       subtitle: 'Thank you for your order!',                color: '#15803D' },
          processing:       { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '#BFDBFE', icon: '⚙️', title: 'Order Processing',        subtitle: 'We are preparing your order.',             color: '#1D4ED8' },
          shipped:          { bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '#DDD6FE', icon: '🚚', title: 'Order Shipped!',           subtitle: order.courier_name ? `Courier: ${order.courier_name}` : 'Your order is on the way!', color: '#6D28D9' },
          delivered:        { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '🎉', title: 'Order Delivered!',         subtitle: 'We hope you love your saree!',             color: '#15803D' },
          cancelled:        { bg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)', border: '#FECDD3', icon: '❌', title: 'Order Cancelled',          subtitle: 'This order has been cancelled.',           color: '#BE123C' },
          return_requested: { bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '#FDE68A', icon: '↩️', title: 'Return Requested',        subtitle: 'We are reviewing your return request.',   color: '#92400E' },
          return_approved:  { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '✅', title: 'Return Approved',          subtitle: 'Please ship the item back to us.',        color: '#15803D' },
          return_rejected:  { bg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)', border: '#FECDD3', icon: '❌', title: 'Return Rejected',          subtitle: 'Your return request was not approved.',   color: '#BE123C' },
          refunded:         { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '💰', title: 'Refund Processed',         subtitle: 'Your refund has been processed.',          color: '#15803D' },
        }
        const s = statusConfig[order.status] || statusConfig.confirmed
        return (
          <div className="rounded-xl p-6 mb-6 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="text-5xl mb-3">{s.icon}</div>
            <h1 className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)', color: s.color }}>{s.title}</h1>
            <p className="text-sm" style={{ color: s.color }}>{s.subtitle}</p>
            {order.tracking_id && (
              <p className="text-xs mt-2 font-mono" style={{ color: s.color }}>Tracking: {order.tracking_id}</p>
            )}
            <p className="text-xs mt-2 font-mono" style={{ color: s.color }}>Order ID: {String(id).slice(0, 8).toUpperCase()}</p>
          </div>
        )
      })()}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Package size={18} style={{ color: 'var(--crimson)' }} /> Items Ordered
        </h2>
        {items.length === 0 ? (
          <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>No items found.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name}
                      className="w-14 object-cover rounded flex-shrink-0" style={{ height: 64 }} />
                  ) : (
                    <div className="w-14 flex items-center justify-center rounded flex-shrink-0 text-2xl"
                      style={{ height: 64, background: 'var(--cream)' }}>🥻</div>
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.product_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {item.colour} · Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--crimson)' }}>
                  ₹{Number(item.total || (item.sale_price || item.original_price) * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Price Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
            <span style={{ color: Number(order.shipping_charge) === 0 ? '#16A34A' : 'inherit' }}>
              {Number(order.shipping_charge) === 0 ? 'FREE' : `₹${Number(order.shipping_charge).toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>GST (5%)</span><span>₹{Number(order.total_gst || order.gst_amount || 0).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            <span>Total Paid</span><span style={{ color: 'var(--crimson)' }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <MapPin size={18} style={{ color: 'var(--crimson)' }} /> Delivery Address
        </h2>
        <div className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{addr.full_name}</p>
          <p>{addr.phone}</p>
          <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
          <p>{addr.city}, {addr.state} – {addr.pincode}</p>
        </div>
      </div>

      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <CreditCard size={18} style={{ color: 'var(--crimson)' }} /> Payment Details
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Method</span>
            <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span className="font-semibold capitalize px-2 py-0.5 rounded-full text-xs text-white"
              style={{ background: statusColors[order.payment_status] || '#6B7280' }}>
              {order.payment_status}
            </span>
          </div>
          {order.razorpay_payment_id && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Payment ID</span>
              <span className="font-mono text-xs">{order.razorpay_payment_id}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/orders" className="btn-outline flex items-center gap-2 flex-1 justify-center">
          <ArrowLeft size={14} /> My Orders
        </Link>
        <Link href="/shop" className="btn-primary flex-1 justify-center">Continue Shopping</Link>
      </div>
    </div>
  )
}
