'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Package, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'
import toast from 'react-hot-toast'

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed: { label: 'Order Placed', color: 'var(--text-secondary)', bg: 'var(--cream)' },
  confirmed: { label: 'Confirmed', color: '#1B5E20', bg: '#E8F5E9' },
  shipped: { label: 'Shipped', color: '#E65100', bg: '#FFF3E0' },
  delivered: { label: 'Delivered', color: '#1B7A3E', bg: '#E8F5E9' },
  cancelled: { label: 'Cancelled', color: 'var(--crimson)', bg: '#FEECEC' },
  return_requested: { label: 'Return Requested', color: '#7B1FA2', bg: '#F3E5F5' },
  return_approved: { label: 'Return Approved', color: '#1565C0', bg: '#E3F2FD' },
  return_rejected: { label: 'Return Rejected', color: 'var(--crimson)', bg: '#FEECEC' },
  refunded: { label: 'Refunded', color: '#1B7A3E', bg: '#E8F5E9' },
}

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const successId = searchParams.get('success')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(successId)
  const [returnForm, setReturnForm] = useState<{ orderId: string; reason: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const requestReturn = async () => {
    if (!returnForm) return
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status: 'return_requested', return_reason: returnForm.reason, return_requested_at: new Date().toISOString() }).eq('id', returnForm.orderId)
    if (!error) {
      toast.success('Return request submitted!')
      setOrders(prev => prev.map(o => o.id === returnForm.orderId ? { ...o, status: 'return_requested' } : o))
    }
    setReturnForm(null)
  }

  if (loading) return <div className="page-container py-20 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Loading orders...</div>

  return (
    <div className="page-container py-8 animate-fadeIn">
      {successId && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 mb-8 border" style={{ borderColor: '#1B7A3E', background: '#E8F5E9' }}>
          <CheckCircle size={20} style={{ color: '#1B7A3E' }} />
          <div>
            <p className="font-medium text-sm" style={{ color: '#1B7A3E' }}>Order placed successfully! 🎉</p>
            <p className="text-xs" style={{ color: '#2E7D32' }}>You'll receive a WhatsApp message when your order is shipped.</p>
          </div>
        </motion.div>
      )}

      <h1 className="section-heading mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
          <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>No orders yet</h2>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = STATUS_MAP[order.status as OrderStatus]
            const isExpanded = expandedId === order.id
            const canReturn = order.status === 'delivered' && new Date(order.updated_at) > new Date(Date.now() - 7 * 86400000)
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="border" style={{ borderColor: 'var(--border)', background: 'white' }}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-sm">{order.order_number}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    <p className="text-sm font-medium" style={{ color: 'var(--crimson)' }}>{formatPrice(order.total_amount)}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
                </div>
                {isExpanded && (
                  <div className="border-t px-4 pb-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                      {/* Items */}
                      <div className="flex-1 space-y-3">
                        {(order.order_items || []).map((item: any) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-14 h-20 border flex-shrink-0" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                              {item.product_image ? <Image src={item.product_image} alt={item.product_name} width={56} height={80} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🥻</div>}
                            </div>
                            <div>
                              <p className="font-light text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{item.product_name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.colour} · Qty {item.quantity}</p>
                              <p className="text-sm mt-1" style={{ color: 'var(--crimson)' }}>{formatPrice(item.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Details */}
                      <div className="md:w-56 space-y-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Delivery Address</p>
                          <p>{order.address_snapshot.fullName}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{order.address_snapshot.addressLine1}, {order.address_snapshot.city}</p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{order.address_snapshot.state} – {order.address_snapshot.pincode}</p>
                        </div>
                        {order.tracking_id && (
                          <div>
                            <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Tracking</p>
                            <p className="text-xs">{order.courier_name}: {order.tracking_id}</p>
                            {order.estimated_delivery && <p className="text-xs">ETA: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Payment</p>
                          <p className="text-xs capitalize">{order.payment_method.toUpperCase()} · <span style={{ color: order.payment_status === 'paid' ? '#1B7A3E' : 'var(--text-secondary)' }}>{order.payment_status}</span></p>
                        </div>
                        {/* Actions */}
                        {canReturn && order.status !== 'return_requested' && (
                          <button onClick={() => setReturnForm({ orderId: order.id, reason: '' })} className="text-xs underline" style={{ color: 'var(--crimson)' }}>Request Return</button>
                        )}
                      </div>
                    </div>
                    {/* Return form */}
                    {returnForm?.orderId === order.id && (
                      <div className="mt-4 p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                        <p className="text-sm font-medium mb-2">Reason for return</p>
                        <textarea value={returnForm.reason} onChange={e => setReturnForm({ ...returnForm, reason: e.target.value })} className="input-base w-full mb-3" style={{ height: 80, padding: '10px 14px', resize: 'none' }} placeholder="Please describe the reason for return (required)" />
                        <div className="flex gap-2">
                          <button onClick={requestReturn} disabled={!returnForm.reason.trim()} className="btn-primary text-sm disabled:opacity-50">Submit Return</button>
                          <button onClick={() => setReturnForm(null)} className="btn-outline text-sm">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
