import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sujaykumar760@gmail.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'

function orderConfirmationHtml(order: any, items: any[], brandName = 'Sai Krishna Silks & Sarees') {
  const addr = order.address_snapshot || order.shipping_address || {}
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #F5EDE3">
        <strong style="color:#1A1A1A">${item.product_name}</strong><br/>
        <span style="color:#8B7355;font-size:13px">${item.colour} · Qty: ${item.quantity}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #F5EDE3;text-align:right;color:#8B1A2B;font-weight:600">
        ₹${Number(item.total || (item.sale_price || item.original_price) * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:white">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:40px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:300;letter-spacing:2px">{brandName}</h1>
      <p style="color:#C9A84C;margin:4px 0 0;font-size:11px;letter-spacing:4px;text-transform:uppercase">SILKS & SAREES</p>
    </div>

    <!-- Success banner -->
    <div style="background:#F0FDF4;border-bottom:2px solid #BBF7D0;padding:24px 32px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">✅</div>
      <h2 style="color:#15803D;margin:0;font-size:22px">Order Confirmed!</h2>
      <p style="color:#166534;margin:8px 0 0;font-size:14px">Thank you for shopping with us</p>
      <p style="color:#16A34A;font-size:12px;font-family:monospace;margin:8px 0 0">
        Order ID: ${String(order.id).slice(0,8).toUpperCase()}
      </p>
    </div>

    <div style="padding:32px">
      <!-- Items -->
      <h3 style="color:#1A1A1A;font-size:16px;margin:0 0 16px;font-weight:600">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;background:#FDFAF7;border-radius:8px;overflow:hidden">
        ${itemsHtml}
      </table>

      <!-- Price summary -->
      <div style="background:#F5EDE3;border-radius:8px;padding:20px;margin:20px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#5A4A3A;font-size:14px">Subtotal</span>
          <span style="color:#1A1A1A;font-size:14px">₹${Number(order.subtotal).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#5A4A3A;font-size:14px">Shipping</span>
          <span style="color:${Number(order.shipping_charge)===0?'#16A34A':'#1A1A1A'};font-size:14px">${Number(order.shipping_charge)===0?'FREE':'₹'+Number(order.shipping_charge).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#5A4A3A;font-size:14px">GST (5%)</span>
          <span style="color:#1A1A1A;font-size:14px">₹${Number(order.total_gst||order.gst_amount||0).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #C9A84C;padding-top:12px">
          <span style="color:#1A1A1A;font-size:16px;font-weight:700">Total Paid</span>
          <span style="color:#8B1A2B;font-size:16px;font-weight:700">₹${Number(order.total_amount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Address -->
      <h3 style="color:#1A1A1A;font-size:16px;margin:20px 0 12px;font-weight:600">Delivery Address</h3>
      <div style="background:#F5EDE3;border-radius:8px;padding:16px;font-size:14px;color:#5A4A3A;line-height:1.8">
        <strong style="color:#1A1A1A">${addr.full_name}</strong><br/>
        ${addr.phone}<br/>
        ${addr.address_line1}${addr.address_line2?', '+addr.address_line2:''}<br/>
        ${addr.city}, ${addr.state} – ${addr.pincode}
      </div>

      <!-- Payment -->
      <h3 style="color:#1A1A1A;font-size:16px;margin:20px 0 12px;font-weight:600">Payment Details</h3>
      <div style="background:#F5EDE3;border-radius:8px;padding:16px;font-size:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#5A4A3A">Method</span>
          <span style="color:#1A1A1A">${order.payment_method==='cod'?'Cash on Delivery':'Online Payment'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#5A4A3A">Status</span>
          <span style="color:#16A34A;font-weight:600;text-transform:capitalize">${order.payment_status}</span>
        </div>
        ${order.razorpay_payment_id?`<div style="display:flex;justify-content:space-between;margin-top:8px"><span style="color:#5A4A3A">Payment ID</span><span style="color:#1A1A1A;font-family:monospace;font-size:12px">${order.razorpay_payment_id}</span></div>`:''}
      </div>

      <!-- Delivery info -->
      <div style="background:#EFF6FF;border-radius:8px;padding:16px;margin-top:20px;text-align:center">
        <p style="color:#1D4ED8;margin:0;font-size:14px">📦 Estimated delivery in <strong>5-7 business days</strong></p>
        <p style="color:#3B82F6;margin:8px 0 0;font-size:13px">You will receive a shipping confirmation once your order is dispatched</p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-top:28px">
        <a href="https://skss-storefront.vercel.app/orders/${order.id}"
          style="background:#8B1A2B;color:white;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">
          View Order Details
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1A1A1A;padding:24px 32px;text-align:center">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase">{brandName}</p>
      <p style="color:#666;margin:8px 0 0;font-size:12px">Pure Silk. Timeless Tradition. Royal Elegance.</p>
      <p style="color:#444;margin:8px 0 0;font-size:11px">Questions? WhatsApp us or reply to this email</p>
    </div>
  </div>
</body>
</html>`
}

function adminNotificationHtml(order: any, items: any[]) {
  const addr = order.address_snapshot || order.shipping_address || {}
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
  <div style="max-width:500px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
    <div style="background:#8B1A2B;padding:20px;text-align:center">
      <h2 style="color:white;margin:0">🛍️ New Order Received!</h2>
    </div>
    <div style="padding:24px">
      <p style="font-size:14px;color:#333"><strong>Order ID:</strong> ${String(order.id).slice(0,8).toUpperCase()}</p>
      <p style="font-size:14px;color:#333"><strong>Total:</strong> ₹${Number(order.total_amount).toLocaleString('en-IN')}</p>
      <p style="font-size:14px;color:#333"><strong>Payment:</strong> ${order.payment_method==='cod'?'Cash on Delivery':'Online - '+order.payment_status}</p>
      <p style="font-size:14px;color:#333"><strong>Customer:</strong> ${addr.full_name} · ${addr.phone}</p>
      <p style="font-size:14px;color:#333"><strong>Address:</strong> ${addr.address_line1}, ${addr.city}, ${addr.state}</p>
      <h3 style="font-size:14px;color:#333">Items:</h3>
      ${items.map(i=>`<p style="font-size:13px;color:#555;margin:4px 0">• ${i.product_name} (${i.colour}) × ${i.quantity}</p>`).join('')}
      <div style="text-align:center;margin-top:20px">
        <a href="https://skss-admin-u9ms.vercel.app/orders"
          style="background:#8B1A2B;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px">
          View in Admin Panel
        </a>
      </div>
    </div>
  </div>
</body>
</html>`
}

function shippingUpdateHtml(order: any, trackingId: string, courierName: string, brandName = 'Sai Krishna Silks & Sarees') {
  const addr = order.address_snapshot || order.shipping_address || {}
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#FDFAF7;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:300">{brandName}</h1>
    </div>
    <div style="padding:32px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">📦</div>
      <h2 style="color:#1A1A1A;margin:0">Your order is on the way!</h2>
      <p style="color:#5A4A3A;margin:12px 0">Order #${String(order.id).slice(0,8).toUpperCase()} has been shipped</p>
      <div style="background:#F5EDE3;border-radius:8px;padding:20px;margin:20px 0;text-align:left">
        <p style="margin:0 0 8px;font-size:14px;color:#5A4A3A"><strong>Courier:</strong> ${courierName}</p>
        <p style="margin:0;font-size:14px;color:#5A4A3A"><strong>Tracking ID:</strong> <span style="font-family:monospace;color:#8B1A2B">${trackingId}</span></p>
      </div>
      <p style="color:#5A4A3A;font-size:14px">Delivering to: <strong>${addr.full_name}</strong>, ${addr.city}</p>
      <p style="color:#3B82F6;font-size:13px">Estimated delivery in 2-3 business days</p>
    </div>
    <div style="background:#1A1A1A;padding:20px;text-align:center">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px">{brandName.toUpperCase()}</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: Request) {
  try {
    const { type, order, items, trackingId, courierName, customerEmail } = await request.json()

    if (type === 'order_confirmation') {
      // Get brand name from site_config
      let brandName = 'Sai Krishna Silks & Sarees'
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data } = await sb.from('site_config').select('value').eq('key', 'brand_name').single()
        if (data?.value) brandName = data.value
      } catch {}

      // Send to customer
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Order Confirmed! #${String(order.id).slice(0,8).toUpperCase()} - ${brandName}`,
        html: orderConfirmationHtml(order, items, brandName),
      })
      // Send to admin
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New Order #${String(order.id).slice(0,8).toUpperCase()} - ₹${Number(order.total_amount).toLocaleString('en-IN')}`,
        html: adminNotificationHtml(order, items),
      })
      return NextResponse.json({ success: true })
    }

    if (type === 'shipping_update') {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Your order has been shipped! #${String(order.id).slice(0,8).toUpperCase()}`,
        html: shippingUpdateHtml(order, trackingId, courierName),
      })

      // Also send WhatsApp for shipping update
      try {
        const addr = order.address_snapshot || order.shipping_address || {}
        const phone = addr.phone
        if (phone) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://skss-storefront.vercel.app'}/api/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'order_shipped', order, phone, trackingId, courierName })
          })
        }
      } catch (e) { console.error('WhatsApp shipping failed:', e) }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
