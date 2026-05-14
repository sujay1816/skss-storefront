'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
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
      // FIX #4: use getUser() instead of getSession() for server-validated auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/orders'); return }
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(product_name, product_image, colour, quantity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

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
            const orderItems = order.order_items || []
            const previewItems = orderItems.slice(0, 3)
            const extraCount = orderItems.length - previewItems.length

            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                style={{ textDecoration: 'none' }}>

                {previewItems.length > 0 && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    {previewItems.map((item: any, i: number) => (
                      <div key={i} className="relative w-14 h-16 sm:w-12 sm:h-14 border overflow-hidden rounded flex-shrink-0"
                        style={{ background: 'var(--cream)', borderColor: 'var(--border)', position: 'relative' }}>
                        {item.product_image ? (
                          <Image src={item.product_image} alt={item.product_name || ''} fill sizes="10vw" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">🥻</div>
                        )}
                        {i === previewItems.length - 1 && extraCount > 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">+{extraCount}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Order #{order.order_number || order.id?.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {addr.city ? ` · ${addr.city}` : ''}
                  </p>
                  {previewItems.length > 0 && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {previewItems.map((i: any) => i.product_name).join(', ')}
                      {extraCount > 0 ? ` +${extraCount} more` : ''}
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--crimson)' }}>
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
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
