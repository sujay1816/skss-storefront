'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Package, ChevronRight } from 'lucide-react'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/orders'); return }
      const { data } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Issue H fix — added all return/refund statuses so badges show correct colours
  const statusColors: Record<string, string> = {
    confirmed:        '#16A34A',
    processing:       '#2563EB',
    shipped:          '#7C3AED',
    delivered:        '#16A34A',
    cancelled:        '#DC2626',
    pending:          '#D97706',
    return_requested: '#92400E',
    return_approved:  '#16A34A',
    return_rejected:  '#DC2626',
    refunded:         '#16A34A',
  }

  // Issue H fix — human readable labels for status badges
  const statusLabels: Record<string, string> = {
    confirmed:        'Confirmed',
    processing:       'Processing',
    shipped:          'Shipped',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
    pending:          'Pending',
    return_requested: 'Return Requested',
    return_approved:  'Return Approved',
    return_rejected:  'Return Rejected',
    refunded:         'Refunded',
  }

  if (loading) return (
    <div className="page-container py-20 text-center">
      <div className="inline-block w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="page-container py-8 max-w-2xl">
      <h1 className="section-heading mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--border)' }} />
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>You haven't placed any orders yet</p>
          <Link href="/shop" className="btn-primary">Browse Collection</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const addr = order.address_snapshot || order.shipping_address || {}
            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ textDecoration: 'none' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--cream)' }}>
                    <Package size={18} style={{ color: 'var(--crimson)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Order #{order.id?.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {addr.city ? ` · ${addr.city}` : ''}
                    </p>
                    <p className="text-sm font-semibold mt-1" style={{ color: 'var(--crimson)' }}>
                      ₹{Number(order.total_amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                    style={{ background: statusColors[order.status] || '#6B7280' }}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
