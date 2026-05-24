import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getCfg } from '@/lib/get-config'

// Module-level fallbacks for use inside HTML template functions
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  || 'https://skss-storefront.vercel.app'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://skss-admin-u9ms.vercel.app'

// Keys read dynamically per request so admin changes take effect immediately
async function getEmailConfig() {
  const [apiKey, adminEmail, fromEmail] = await Promise.all([
    getCfg('setup_resend_api_key', process.env.RESEND_API_KEY),
    getCfg('setup_admin_email',    process.env.ADMIN_EMAIL || ''),
    getCfg('setup_from_email',     process.env.FROM_EMAIL  || 'onboarding@resend.dev'),
  ])
  return { resend: new Resend(apiKey), adminEmail, fromEmail }
}

function orderConfirmationHtml(order: any, items: any[], brandName: string) {
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
      <h1 style="color:white;margin:0;font-size:28px;font-weight:300;letter-spacing:2px">${brandName}</h1>
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
        ${order.coupon_code ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#16A34A;font-size:14px">Coupon (${order.coupon_code})</span>
          <span style="color:#16A34A;font-size:14px">−₹${Number(order.coupon_discount||0).toLocaleString('en-IN')}</span>
        </div>` : ''}
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

      <!-- CTA — Issue A fix: uses SITE_URL env var -->
      <div style="text-align:center;margin-top:28px">
        <a href="${SITE_URL}/orders/${order.id}"
          style="background:#8B1A2B;color:white;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">
          View Order Details
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1A1A1A;padding:24px 32px;text-align:center">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase">${brandName}</p>
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
      ${order.coupon_code ? `<p style="font-size:14px;color:#333"><strong>Coupon:</strong> ${order.coupon_code} (−₹${Number(order.coupon_discount||0).toLocaleString('en-IN')})</p>` : ''}
      <h3 style="font-size:14px;color:#333">Items:</h3>
      ${items.map(i=>`<p style="font-size:13px;color:#555;margin:4px 0">• ${i.product_name} (${i.colour}) × ${i.quantity}</p>`).join('')}
      <!-- Issue B fix: uses ADMIN_URL env var -->
      <div style="text-align:center;margin-top:20px">
        <a href="${ADMIN_URL}/orders"
          style="background:#8B1A2B;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px">
          View in Admin Panel
        </a>
      </div>
    </div>
  </div>
</body>
</html>`
}

function shippingUpdateHtml(order: any, trackingId: string, courierName: string, brandName: string) {
  const addr = order.address_snapshot || order.shipping_address || {}
  return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#FDFAF7;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:300">${brandName}</h1>
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
      <!-- Issue A fix: uses SITE_URL env var -->
      <div style="text-align:center;margin-top:20px">
        <a href="${SITE_URL}/orders/${order.id}"
          style="background:#8B1A2B;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px">
          Track Your Order
        </a>
      </div>
    </div>
    <div style="background:#1A1A1A;padding:20px;text-align:center">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px">${brandName.toUpperCase()}</p>
    </div>
  </div>
</body>
</html>`
}

function restockConfirmationHtml(productName: string, colour: string, brandName: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border:1px solid #E8DDD4;">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:28px 32px;text-align:center;">
      <h1 style="color:white;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif;">${brandName}</h1>
      <p style="color:rgba(201,168,76,0.9);font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:6px 0 0;">✦ SILKS &amp; SAREES ✦</p>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 12px;font-family:Georgia,serif;">We'll let you know!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;">
        You're now on the waitlist for:
      </p>
      <div style="background:#FFF8F0;border-left:3px solid #C9A84C;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:500;color:#1A1A1A;">${productName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5A4A3A;">Colour: ${colour}</p>
      </div>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 24px;">
        As soon as this item is back in stock, you'll be the first to know. We'll send you an email with a direct link so you can grab it before it sells out again.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${siteUrl}/shop" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;">
          Browse Other Sarees
        </a>
      </div>
      <p style="font-size:12px;color:#9A8A7A;text-align:center;margin:0;">
        If you didn't request this notification, please ignore this email.
      </p>
    </div>
    <div style="background:#F5EDE3;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#9A8A7A;margin:0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

function restockAvailableHtml(productName: string, colour: string, productUrl: string, brandName: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border:1px solid #E8DDD4;">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:28px 32px;text-align:center;">
      <h1 style="color:white;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif;">${brandName}</h1>
      <p style="color:rgba(201,168,76,0.9);font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:6px 0 0;">✦ SILKS &amp; SAREES ✦</p>
    </div>
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="display:inline-block;background:#EAF6ED;color:#15803D;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:99px;">Back in Stock!</span>
      </div>
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 12px;font-family:Georgia,serif;">Great news — it's available again!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;">
        The saree you were waiting for is back in stock. Grab it before it sells out again!
      </p>
      <div style="background:#FFF8F0;border-left:3px solid #C9A84C;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:500;color:#1A1A1A;">${productName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5A4A3A;">Colour: ${colour}</p>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${productUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 4px 14px rgba(139,26,43,0.35);">
          Shop Now →
        </a>
      </div>
      <p style="font-size:12px;color:#9A8A7A;text-align:center;margin:0;">
        Hurry — limited stock available. This item may sell out quickly.
      </p>
    </div>
    <div style="background:#F5EDE3;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#9A8A7A;margin:0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}


export async function POST(request: Request) {
  try {
    const { type, order, items, trackingId, courierName, customerEmail, productName, colour, productUrl, productSlug } = await request.json()
    const { resend, adminEmail: ADMIN_EMAIL, fromEmail: FROM_EMAIL } = await getEmailConfig()

    if (type === 'order_confirmation') {
      const brandName = await getCfg('brand_name', process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store')
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Order Confirmed! #${String(order.id).slice(0,8).toUpperCase()} - ${brandName}`,
        html: orderConfirmationHtml(order, items, brandName),
      })
      if (ADMIN_EMAIL) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `New Order #${String(order.id).slice(0,8).toUpperCase()} - ₹${Number(order.total_amount).toLocaleString('en-IN')}`,
          html: adminNotificationHtml(order, items),
        })
      }
      return NextResponse.json({ success: true })
    }

    if (type === 'shipping_update') {
      const brandName = await getCfg('brand_name', process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store')
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Your order has been shipped! #${String(order.id).slice(0,8).toUpperCase()}`,
        html: shippingUpdateHtml(order, trackingId, courierName, brandName),
      })
      return NextResponse.json({ success: true })
    }

    // Restock: sent immediately when customer registers for notification
    if (type === 'restock_confirmation') {
      const brandName = await getCfg('brand_name', process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store')
      const siteUrl = await getCfg('setup_site_url', process.env.NEXT_PUBLIC_SITE_URL || '')
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `We'll notify you when ${productName} is back — ${brandName}`,
        html: restockConfirmationHtml(productName, colour, brandName, siteUrl),
      })
      return NextResponse.json({ success: true })
    }

    // Restock: sent when admin restocks and customers are waiting
    if (type === 'restock_available') {
      const brandName = await getCfg('brand_name', process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store')
      const siteUrl = await getCfg('setup_site_url', process.env.NEXT_PUBLIC_SITE_URL || '')
      const fullProductUrl = productUrl || (productSlug ? `${siteUrl}/product/${productSlug}` : `${siteUrl}/shop`)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `${productName} is back in stock! — ${brandName}`,
        html: restockAvailableHtml(productName, colour, fullProductUrl, brandName, siteUrl),
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
