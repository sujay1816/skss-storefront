'use client'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { Package, ChevronRight, Search as SearchIcon, X } from 'lucide-react'

const OrderSkeleton = () => (
  <div className="card p-4 space-y-3">
    <div className="flex gap-3">
      {[1,2,3].map(i => <div key={i} className="skeleton rounded flex-shrink-0" style={{ width: 56, height: 64 }} />)}
    </div>
    <div className="space-y-2">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton h-3 w-28 rounded" />
      <div className="skeleton h-4 w-24 rounded" />
    </div>
  </div>
)

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
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
    confirmed: '#16A34A', processing: '#2563EB', shipped: '#7C3AED',
    delivered: '#16A34A', cancelled: '#DC2626', pending: '#D97706',
    return_requested: '#92400E', return_approved: '#16A34A',
    return_rejected: '#DC2626', refunded: '#16A34A',
  }
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped',
    delivered: 'Delivered', cancelled: 'Cancelled', pending: 'Pending',
    return_requested: 'Return Requested', return_approved: 'Return Approved',
    return_rejected: 'Return Rejected', refunded: 'Refunded',
  }

  const filteredOrders = useMemo(() => orders.filter(o => {
    const matchStatus = !statusFilter || o.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.order_items || []).some((i: any) => (i.product_name || '').toLowerCase().includes(q))
    return matchStatus && matchSearch
  }), [orders, search, statusFilter])

  if (loading) return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      <div className="skeleton h-8 w-36 rounded mb-6" />
      <div className="flex gap-3 mb-6">
        <div className="skeleton h-10 flex-1 rounded" />
        <div className="skeleton h-10 w-40 rounded" />
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => <OrderSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="page-container py-8 max-w-2xl animate-fadeIn">
      <div className="mb-4">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'My Orders' }]} />
      </div>
      <h1 className="section-heading mb-6">My Orders</h1>
      {orders.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6 orders-filter-bar">
          <div className="relative flex-1">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input type="text" aria-label="Search orders" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number or product..." className="input-base pl-9 pr-8 w-full" style={{ height: 40 }} />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
                style={{ color: 'var(--text-secondary)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="input-base" style={{ height: 40, minWidth: 160 }}>
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      )}
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="empty-state-icon mx-auto mb-6" style={{ width: 80, height: 80 }}>
            <Package size={36} style={{ color: 'var(--crimson)', opacity: 0.5 }} />
          </div>
          <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>No orders yet</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>You haven't placed any orders yet.</p>
          <Link href="/shop" className="btn-primary">Browse Collection</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>No orders match your search.</p>
              <button type="button" onClick={() => { setSearch(''); setStatusFilter('') }} className="btn-outline text-xs">Clear filters</button>
            </div>
          )}
          {filteredOrders.map(order => {
            const addr = order.address_snapshot || order.shipping_address || {}
            const orderItems = order.order_items || []
            const previewItems = orderItems.slice(0, 3)
            const extraCount = orderItems.length - previewItems.length
            return (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                style={{ textDecoration: 'none' }}>
                {previewItems.length > 0 && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    {previewItems.map((item: any, i: number) => (
                      <div key={i} className="relative border overflow-hidden rounded flex-shrink-0"
                        style={{ width: 56, height: 64, background: 'var(--cream)', borderColor: 'var(--border)' }}>
                        {item.product_image
                          ? <Image src={item.product_image} alt={item.product_name || ''} fill sizes="56px" className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-base">🥻</div>}
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
