'use client'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, MapPin, CreditCard, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import Breadcrumb from '@/components/layout/Breadcrumb'

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // FIX #8: return request state
  const [returnReason, setReturnReason] = useState('')
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  // Return instructions — loaded from site_config
  const [returnConfig, setReturnConfig] = useState<{
    businessAddress: string
    whatsappNumber: string
    supportEmail: string
    returnWindowDays: string
    brandName: string
  }>({ businessAddress: '', whatsappNumber: '', supportEmail: '', returnWindowDays: '7', brandName: 'SKSS' })
  // FIX: Moved here from after if(!order) guard — hooks must always be called unconditionally
  const [cancelling, setCancelling] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      // FIX #7: use getUser() instead of getSession() for server-validated auth
      const { data: { user } } = await supabase.auth.getUser()
      // FIX: include redirect param so user returns to their order after login
      if (!user) { router.push(`/login?redirect=/orders/${id}`); return }

      const { data: o } = await supabase
        .from('orders').select('*').eq('id', id).eq('user_id', user.id).single()
      if (!o) { router.push('/orders'); return }
      setOrder(o)

      const { data: oi } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)
      setItems(oi || [])
      // Load return instructions from site_config
      const { data: cfg } = await supabase
        .from('site_config')
        .select('key, value')
        .in('key', ['business_address', 'whatsapp_number', 'support_email', 'return_window_days', 'brand_name'])
      if (cfg) {
        const c: Record<string, string> = {}
        cfg.forEach((r: any) => { c[r.key] = r.value })
        setReturnConfig({
          businessAddress: c.business_address || '',
          whatsappNumber: c.whatsapp_number || '',
          supportEmail: c.support_email || '',
          returnWindowDays: c.return_window_days || '7',
          brandName: c.brand_name || 'SKSS',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  // FIX #8: submit return request
  const submitReturnRequest = async () => {
    if (!returnReason.trim()) return
    setReturnSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'return_requested', return_reason: returnReason })
      .eq('id', id)
    if (error) {
      alert('Could not submit return request. Please try again.')
      setReturnSubmitting(false)
      return
    }
    setOrder((o: any) => ({ ...o, status: 'return_requested', return_reason: returnReason }))

    // Notify admin of return request (non-blocking)
    supabase.from('admin_notifications').insert({
      type: 'return_request',
      title: 'Return Request',
      message: `Order ${String(id).slice(0,8).toUpperCase()}: ${returnReason.slice(0, 120)}`,
      reference_type: 'order',
      reference_id: id,
      is_read: false,
      created_at: new Date().toISOString(),
    }).then(() => {})

    setShowReturnForm(false)
    setReturnSubmitting(false)
  }

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

  // UI/UX: dynamic GST label
  const gstLabel = order.gst_rate ? `GST (${order.gst_rate}%)` : 'GST (5%)'

  // FIX: Return window enforcement — compare delivery time to return_window_days from site_config
  const returnWindowDays = Number(returnConfig.returnWindowDays) || 7
  const deliveredAt = order.updated_at ? new Date(order.updated_at) : null
  const daysSinceDelivery = deliveredAt ? Math.floor((Date.now() - deliveredAt.getTime()) / 86400000) : 999
  const withinReturnWindow = daysSinceDelivery <= returnWindowDays
  const canRequestReturn = order.status === 'delivered' && withinReturnWindow
  const returnWindowExpired = order.status === 'delivered' && !withinReturnWindow
  const returnAlreadyRequested = ['return_requested', 'return_approved', 'return_rejected', 'refunded'].includes(order.status)

  // FIX: Customer cancellation — only allowed when status is confirmed (not yet shipped)
  const canCancel = order.status === 'confirmed'

  const submitCancellation = async () => {
    if (!cancelReason.trim()) return
    setCancelling(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', notes: `Customer cancelled: ${cancelReason}` })
      .eq('id', id)
    if (error) {
      alert('Could not cancel order. Please contact support.')
      setCancelling(false)
      return
    }
    // Restore stock for all order items
    try {
      const cfg = await supabase.from('site_config').select('value').eq('key', 'setup_internal_api_secret').maybeSingle()
      const secret = cfg.data?.value || process.env.NEXT_PUBLIC_INTERNAL_API_SECRET || ''
      await fetch('/api/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
        body: JSON.stringify({
          type: 'restore',
          items: items.map((i: any) => ({ product_id: i.product_id, colour: i.colour, quantity: i.quantity })),
        }),
      })
    } catch {}
    setOrder((o: any) => ({ ...o, status: 'cancelled' }))
    setShowCancelForm(false)
    setCancelling(false)
  }

  // UI/UX: order progress stepper
  const STEPS = [
    { key: 'confirmed',  label: 'Confirmed',  icon: '✅' },
    { key: 'shipped',    label: 'Shipped',    icon: '📦' },
    { key: 'delivered',  label: 'Delivered',  icon: '🎉' },
  ]
  const stepOrder = ['confirmed', 'processing', 'shipped', 'delivered']
  const currentStepIdx = stepOrder.indexOf(order.status)
  const downloadInvoice = async () => {
    setDownloadingInvoice(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.refreshSession()
      const token = session?.access_token
      if (!token) { alert('Please sign in again to download the invoice'); return }
      const res = await fetch(`/api/invoice?orderId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { alert('Could not generate invoice. Please try again.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `invoice-${String(id).slice(0,8).toUpperCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not generate invoice. Please try again.')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  const isCancelledOrReturn = ['cancelled', 'return_requested', 'return_approved', 'return_rejected', 'refunded'].includes(order.status)


  // FIX: Courier tracking links — maps courier name to tracking URL
  const COURIER_URLS: Record<string, string> = {
    delhivery:    'https://www.delhivery.com/track/package/{id}',
    bluedart:     'https://www.bluedart.com/tracking?trackFor=0&trackNum={id}',
    'blue dart':  'https://www.bluedart.com/tracking?trackFor=0&trackNum={id}',
    dtdc:         'https://www.dtdc.in/tracking.asp?awbno={id}',
    ekart:        'https://ekart.com/tracking?awb={id}',
    xpressbees:   'https://www.xpressbees.com/shipment/tracking/?awb={id}',
    shadowfax:    'https://tracker.shadowfax.in/?waybill={id}',
    speedpost:    'https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx',
    'india post': 'https://www.indiapost.gov.in/VAS/Pages/trackconsignment.aspx',
    ecom:         'https://ecomexpress.in/tracking/?awb_field={id}',
    'ecom express': 'https://ecomexpress.in/tracking/?awb_field={id}',
    amazon:       'https://track.amazon.in/tracking/{id}',
  }

  const getTrackingUrl = (courier: string, trackingId: string) => {
    const key = courier.toLowerCase().trim()
    const template = Object.entries(COURIER_URLS).find(([k]) => key.includes(k))?.[1]
    return template ? template.replace('{id}', encodeURIComponent(trackingId)) : null
  }

  return (
    <div className="page-container py-8 max-w-2xl">
      <div className="mb-4">
        <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'My Orders', href: '/orders' }, { label: `Order #${String(id).slice(0,8).toUpperCase()}` }]} />
      </div>
      {(() => {
        const statusConfig: Record<string, { bg: string; border: string; icon: string; title: string; subtitle: string; color: string }> = {
          confirmed:        { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '✅', title: 'Order Confirmed!',       subtitle: 'Thank you for your order!',                color: '#15803D' },
          processing:       { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '#BFDBFE', icon: '⚙️', title: 'Order Processing',        subtitle: 'We are preparing your order.',             color: '#1D4ED8' },
          shipped:          { bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '#DDD6FE', icon: '🚚', title: 'Order Shipped!',           subtitle: order.courier_name ? `Courier: ${order.courier_name}` : 'Your order is on the way!', color: '#6D28D9' },
          delivered:        { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '🎉', title: 'Order Delivered!',         subtitle: 'We hope you love your saree!',             color: '#15803D' },
          cancelled:        { bg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)', border: '#FECDD3', icon: '❌', title: 'Order Cancelled',          subtitle: 'This order has been cancelled.',           color: '#BE123C' },
          return_requested: { bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '#FDE68A', icon: '↩️', title: 'Return Requested',        subtitle: 'We are reviewing your return request.',   color: '#92400E' },
          return_approved:  { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#BBF7D0', icon: '✅', title: 'Return Approved',          subtitle: 'Your return has been approved! See instructions below.',        color: '#15803D' },
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
              <div className="mt-3 p-3 rounded-lg flex items-center justify-between flex-wrap gap-2"
                style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: s.color }}>📦 Shipment Tracking</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: s.color }}>
                    {order.tracking_id}{order.courier_name ? ` · ${order.courier_name}` : ''}
                  </p>
                </div>
                {order.courier_name && getTrackingUrl(order.courier_name, order.tracking_id) && (
                  <a href={getTrackingUrl(order.courier_name, order.tracking_id)!}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded transition-opacity hover:opacity-80"
                    style={{ background: s.color, color: 'white', textDecoration: 'none' }}>
                    Track Package →
                  </a>
                )}
              </div>
            )}
            <p className="text-xs mt-2 font-mono" style={{ color: s.color }}>Order ID: {String(id).slice(0, 8).toUpperCase()}</p>
          </div>
        )
      })()}

      {/* Return approved — step-by-step instructions card */}
      {order.status === 'return_approved' && (
        <div className="card p-5 mb-4" style={{ borderLeft: '4px solid #15803D' }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: '#15803D' }}>
            📦 How to send your item back
          </h2>

          {/* Steps */}
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: '#15803D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>1</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Pack the item securely</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Use the original packaging if possible. The item must be unused, unwashed, and with all tags attached.
                  Include a note with your Order ID: <strong>{String(id).slice(0, 8).toUpperCase()}</strong>
                </p>
              </div>
            </li>

            <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: '#15803D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>2</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ship to our address</p>
                {returnConfig.businessAddress ? (
                  <p className="text-xs mt-1 p-2 rounded" style={{ color: 'var(--text-primary)', background: 'var(--cream)', fontFamily: 'monospace', lineHeight: 1.8 }}>
                    {returnConfig.businessAddress}
                  </p>
                ) : (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Please contact us for the return address.
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Use any courier of your choice — Speed Post, DTDC, or Delhivery work well. Keep the receipt.
                </p>
              </div>
            </li>

            <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: '#15803D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>3</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Share the tracking details</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Once shipped, send us the courier name and tracking ID so we can watch for your parcel.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {returnConfig.whatsappNumber && (
                    <a
                      href={`https://wa.me/${returnConfig.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi! I've shipped back my return for Order ${String(id).slice(0, 8).toUpperCase()}. Courier: [name], Tracking: [ID]`}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-primary text-xs flex items-center gap-1.5"
                      style={{ background: '#25D366', borderColor: '#25D366', padding: '6px 12px', borderRadius: 6, color: 'white', textDecoration: 'none', fontSize: 12 }}>
                      WhatsApp us
                    </a>
                  )}
                  {returnConfig.supportEmail && (
                    <a
                      href={`mailto:${returnConfig.supportEmail}?subject=Return tracking — Order ${String(id).slice(0, 8).toUpperCase()}&body=Hi, I have shipped back my return. Order ID: ${String(id).slice(0, 8).toUpperCase()}%0ACourier: %0ATracking ID: `}
                      className="btn-outline text-xs"
                      style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, color: 'var(--crimson)', borderColor: 'var(--crimson)', textDecoration: 'none' }}>
                      Email us
                    </a>
                  )}
                </div>
              </div>
            </li>

            <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: '#15803D', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>4</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Refund processed after we receive it</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Once we verify the returned item, your refund will be initiated to the original payment method within 5–7 business days.
                  COD orders are refunded via bank transfer — we will contact you for details.
                </p>
              </div>
            </li>
          </ol>

          {/* Important note */}
          <div className="mt-4 p-3 rounded text-xs" style={{ background: '#FEF9C3', color: '#713F12', border: '1px solid #FDE68A' }}>
            ⚠️ <strong>Important:</strong> Return shipping cost is borne by the customer unless the item received was damaged or incorrect.
            Refund will not be processed if the item shows signs of use or is missing original tags.
          </div>
        </div>
      )}

      {/* UI/UX: order progress stepper */}
      {!isCancelledOrReturn && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between relative">
            {/* FIX #12: use percentage-based margins instead of fixed mx-8 for narrow screens */}
            <div className="absolute left-0 right-0 top-4 h-0.5" style={{ margin: '0 12%', background: 'var(--border)', zIndex: 0 }} />
            <div className="absolute left-0 top-4 h-0.5" style={{
              margin: '0 12%',
              background: 'var(--crimson)',
              zIndex: 1,
              right: currentStepIdx >= 2 ? '12%' : currentStepIdx >= 1 ? '56%' : '100%',
              transition: 'right 0.4s ease',
            }} />
            {STEPS.map((step, i) => {
              const done = currentStepIdx >= stepOrder.indexOf(step.key)
              const active = stepOrder.indexOf(step.key) === currentStepIdx
              return (
                <div key={step.key} className="flex flex-col items-center gap-1 relative z-10" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 'clamp(28px, 7vw, 32px)', height: 'clamp(28px, 7vw, 32px)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--crimson)' : 'white',
                    border: `2px solid ${done ? 'var(--crimson)' : 'var(--border)'}`,
                    boxShadow: active ? '0 0 0 3px rgba(139,26,43,0.2)' : 'none',
                    flexShrink: 0,
                  }}>
                    {done ? <span style={{ fontSize: 11 }}>{step.icon}</span> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border)', display: 'block' }} />}
                  </div>
                  <p className="text-center truncate w-full px-0.5" style={{ color: done ? 'var(--crimson)' : 'var(--text-secondary)', fontSize: 'clamp(8px, 2vw, 11px)', fontWeight: 500 }}>{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
          <Package size={18} style={{ color: 'var(--crimson)' }} /> Items Ordered
        </h2>
        {items.length === 0 ? (
          <p className="text-sm py-2" style={{ color: 'var(--text-secondary)' }}>No items found.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 last:pb-0 order-item-row" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name || "Product image"}
                      loading="lazy" decoding="async" width="56" height="64"
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
          {order.coupon_discount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: '#16A34A' }}>Coupon {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
              <span style={{ color: '#16A34A' }}>−₹{Number(order.coupon_discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
            <span style={{ color: Number(order.shipping_charge) === 0 ? '#16A34A' : 'inherit' }}>
              {Number(order.shipping_charge) === 0 ? 'FREE' : `₹${Number(order.shipping_charge).toLocaleString('en-IN')}`}
            </span>
          </div>
          {/* FIX #11: dynamic GST label */}
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>{gstLabel}</span><span>₹{Number(order.total_gst || order.gst_amount || 0).toLocaleString('en-IN')}</span></div>
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

      <div className="card p-5 mb-4">
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

      {/* FIX #8: Return request section — only shown for delivered orders */}
      {canRequestReturn && (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <RotateCcw size={18} style={{ color: 'var(--crimson)' }} /> Returns
          </h2>
          {!showReturnForm ? (
            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Not satisfied? You can request a return within the return window. Please ensure the item is unused and in original packaging.
              </p>
              <button
                onClick={() => setShowReturnForm(true)}
                className="btn-outline text-sm"
                style={{ color: 'var(--crimson)', borderColor: 'var(--crimson)' }}>
                Request Return
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Please describe the reason for your return:</p>
              <textarea
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder="e.g. Wrong colour received, damaged item..."
                className="input-base w-full mb-3"
                style={{ height: 80, padding: '10px 12px', resize: 'none', fontSize: 13 }}
              />
              <div className="flex gap-2">
                <button
                  onClick={submitReturnRequest}
                  disabled={returnSubmitting || !returnReason.trim()}
                  className="btn-primary text-sm"
                  style={{ opacity: returnSubmitting || !returnReason.trim() ? 0.6 : 1 }}>
                  {returnSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowReturnForm(false)} className="btn-outline text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {returnAlreadyRequested && (
        <div className="card p-4 mb-4 text-sm" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Return status:</strong> {order.status.replace(/_/g, ' ')}
            {order.return_reason && <span> — {order.return_reason}</span>}
          </p>
        </div>
      )}

      {/* FIX: Return window expired notice */}
      {returnWindowExpired && (
        <div className="card p-4 mb-4 text-sm" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
          <p style={{ color: '#92400E' }}>
            The {returnWindowDays}-day return window for this order has closed (delivered {daysSinceDelivery} days ago).
            If you have an issue with this order, please contact us.
          </p>
          <div className="flex gap-2 mt-2">
            {returnConfig.whatsappNumber && (
              <a href={`https://wa.me/${returnConfig.whatsappNumber.replace(/[^0-9]/g,'')}?text=Hi, I have an issue with order ${String(id).slice(0,8).toUpperCase()} (return window expired)`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium" style={{ color: '#15803D' }}>WhatsApp us →</a>
            )}
          </div>
        </div>
      )}

      {/* FIX: Customer cancellation — shown only for confirmed orders */}
      {canCancel && (
        <div className="card p-5 mb-4" style={{ borderLeft: '4px solid #DC2626' }}>
          <h2 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#DC2626' }}>
            Cancel Order
          </h2>
          {!showCancelForm ? (
            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                You can cancel this order as it hasn't been shipped yet. Once shipped, cancellation is not possible.
              </p>
              <button type="button" onClick={() => setShowCancelForm(true)} className="btn-outline text-sm"
                style={{ color: '#DC2626', borderColor: '#DC2626' }}>
                Cancel Order
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Please tell us why you'd like to cancel:</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Ordered by mistake, found a better price..."
                className="input-base w-full mb-3"
                style={{ height: 72, padding: '10px 12px', resize: 'none', fontSize: 13 }}
              />
              <div className="flex gap-2">
                <button type="button" onClick={submitCancellation} disabled={cancelling || !cancelReason.trim()}
                  className="btn-primary text-sm" style={{ background: '#DC2626', borderColor: '#DC2626', opacity: cancelling || !cancelReason.trim() ? 0.6 : 1 }}>
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button type="button" onClick={() => setShowCancelForm(false)} className="btn-outline text-sm">Keep Order</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/orders" className="btn-outline flex items-center gap-2 flex-1 justify-center">
          <ArrowLeft size={14} /> My Orders
        </Link>
        <button type="button" onClick={downloadInvoice} disabled={downloadingInvoice}
          className="btn-outline flex items-center gap-2 text-sm"
          style={{ opacity: downloadingInvoice ? 0.6 : 1 }}>
          {downloadingInvoice
            ? <><span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generating...</>
            : <>📄 Invoice PDF</>}
        </button>
        <Link href="/shop" className="btn-primary flex-1 justify-center">Continue Shopping</Link>
        <button type="button"
          onClick={() => {
            const url = window.location.origin + '/shop'
            const msg = `Check out this beautiful silk saree collection!`
            if (navigator.share) {
              navigator.share({ title: 'Silk Sarees', text: msg, url }).catch(() => {})
            } else {
              window.open(`https://wa.me/?text=${encodeURIComponent(msg + ' ' + url)}`, '_blank', 'noopener')
            }
          }}
          className="btn-outline flex items-center gap-2 text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share
        </button>
      </div>
    </div>
  )
}
