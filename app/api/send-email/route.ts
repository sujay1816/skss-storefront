import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getCfg } from '@/lib/get-config'

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  || 'https://skss-storefront.vercel.app'
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://skss-admin-u9ms.vercel.app'

async function getEmailConfig() {
  const [apiKey, adminEmail, fromEmail] = await Promise.all([
    getCfg('setup_resend_api_key', process.env.RESEND_API_KEY),
    getCfg('setup_admin_email',    process.env.ADMIN_EMAIL || ''),
    getCfg('setup_from_email',     process.env.FROM_EMAIL  || ''),
  ])
  return { resend: new Resend(apiKey || ''), adminEmail, fromEmail, apiKey }
}

// ─────────────────────────────────────────────────────────────
// EMAIL HTML TEMPLATES
// ─────────────────────────────────────────────────────────────

function header(brandName: string) {
  return `
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:300;letter-spacing:2px;font-family:Georgia,serif;">${brandName}</h1>
      <p style="color:#C9A84C;margin:4px 0 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;">✦ SILKS &amp; SAREES ✦</p>
    </div>`
}

function footer(brandName: string) {
  return `
    <div style="background:#1A1A1A;padding:20px 32px;text-align:center;">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">${brandName}</p>
      <p style="color:#666;margin:6px 0 0;font-size:12px;">Pure Silk. Timeless Tradition. Royal Elegance.</p>
    </div>`
}

function orderConfirmationHtml(order: any, items: any[], brandName: string) {
  const addr = order.address_snapshot || order.shipping_address || {}
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #F5EDE3;">
        <strong style="color:#1A1A1A;">${item.product_name}</strong><br/>
        <span style="color:#8B7355;font-size:13px;">${item.colour} · Qty: ${item.quantity}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #F5EDE3;text-align:right;color:#8B1A2B;font-weight:600;">
        &#8377;${Number(item.total || (item.sale_price || item.original_price) * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    ${header(brandName)}
    <div style="background:#F0FDF4;border-bottom:2px solid #BBF7D0;padding:24px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">&#9989;</div>
      <h2 style="color:#15803D;margin:0;font-size:22px;">Order Confirmed!</h2>
      <p style="color:#166534;margin:8px 0 0;font-size:14px;">Thank you for shopping with us</p>
      <p style="color:#16A34A;font-size:12px;font-family:monospace;margin:8px 0 0;">Order ID: ${String(order.id).slice(0,8).toUpperCase()}</p>
    </div>
    <div style="padding:32px;">
      <h3 style="color:#1A1A1A;font-size:16px;margin:0 0 16px;font-weight:600;">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;background:#FDFAF7;">${itemsHtml}</table>
      <div style="background:#F5EDE3;border-radius:8px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#5A4A3A;font-size:14px;">Subtotal</span>
          <span style="font-size:14px;">&#8377;${Number(order.subtotal||0).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#5A4A3A;font-size:14px;">Shipping</span>
          <span style="color:${Number(order.shipping_charge)===0?'#16A34A':'#1A1A1A'};font-size:14px;">${Number(order.shipping_charge)===0?'FREE':'&#8377;'+Number(order.shipping_charge).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#5A4A3A;font-size:14px;">GST</span>
          <span style="font-size:14px;">&#8377;${Number(order.total_gst||order.gst_amount||0).toLocaleString('en-IN')}</span>
        </div>
        ${order.coupon_code ? `<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#16A34A;font-size:14px;">Coupon (${order.coupon_code})</span><span style="color:#16A34A;font-size:14px;">&#8722;&#8377;${Number(order.coupon_discount||0).toLocaleString('en-IN')}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;border-top:1px solid #C9A84C;padding-top:12px;">
          <span style="font-size:16px;font-weight:700;">Total Paid</span>
          <span style="color:#8B1A2B;font-size:16px;font-weight:700;">&#8377;${Number(order.total_amount||0).toLocaleString('en-IN')}</span>
        </div>
      </div>
      <h3 style="color:#1A1A1A;font-size:16px;margin:20px 0 12px;font-weight:600;">Delivery Address</h3>
      <div style="background:#F5EDE3;border-radius:8px;padding:16px;font-size:14px;color:#5A4A3A;line-height:1.8;">
        <strong style="color:#1A1A1A;">${addr.full_name||''}</strong><br/>
        ${addr.phone||''}<br/>
        ${addr.address_line1||''}${addr.address_line2?', '+addr.address_line2:''}<br/>
        ${addr.city||''}, ${addr.state||''} ${addr.pincode?'&#8211; '+addr.pincode:''}
      </div>
      <h3 style="color:#1A1A1A;font-size:16px;margin:20px 0 12px;font-weight:600;">Payment</h3>
      <div style="background:#F5EDE3;border-radius:8px;padding:16px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#5A4A3A;">Method</span>
          <span>${order.payment_method==='cod'?'Cash on Delivery':'Online Payment'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#5A4A3A;">Status</span>
          <span style="color:#16A34A;font-weight:600;text-transform:capitalize;">${order.payment_status||''}</span>
        </div>
        ${order.razorpay_payment_id?`<div style="display:flex;justify-content:space-between;margin-top:8px;"><span style="color:#5A4A3A;">Payment ID</span><span style="font-family:monospace;font-size:12px;">${order.razorpay_payment_id}</span></div>`:''}
      </div>
      <div style="background:#EFF6FF;border-radius:8px;padding:16px;margin-top:20px;text-align:center;">
        <p style="color:#1D4ED8;margin:0;font-size:14px;">&#128230; Estimated delivery in <strong>${order.estimated_delivery||'5-7 business days'}</strong></p>
        <p style="color:#3B82F6;margin:8px 0 0;font-size:13px;">You will receive a shipping update once dispatched</p>
      </div>
      <div style="text-align:center;margin-top:28px;">
        <a href="${SITE_URL}/orders/${order.id}" style="background:#8B1A2B;color:white;padding:14px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">View Order Details</a>
      </div>
    </div>
    ${footer(brandName)}
  </div>
</body></html>`
}

function adminOrderNotificationHtml(order: any, items: any[]) {
  const addr = order.address_snapshot || order.shipping_address || {}
  return `<!DOCTYPE html><html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;">
    <div style="background:#8B1A2B;padding:20px;text-align:center;">
      <h2 style="color:white;margin:0;">&#128717; New Order Received!</h2>
    </div>
    <div style="padding:24px;">
      <p style="font-size:14px;"><strong>Order ID:</strong> ${String(order.id).slice(0,8).toUpperCase()}</p>
      <p style="font-size:14px;"><strong>Total:</strong> &#8377;${Number(order.total_amount||0).toLocaleString('en-IN')}</p>
      <p style="font-size:14px;"><strong>Payment:</strong> ${order.payment_method==='cod'?'Cash on Delivery':'Online &#8212; '+order.payment_status}</p>
      <p style="font-size:14px;"><strong>Customer:</strong> ${addr.full_name||''} &#183; ${addr.phone||''}</p>
      <p style="font-size:14px;"><strong>Address:</strong> ${addr.address_line1||''}, ${addr.city||''}, ${addr.state||''}</p>
      ${order.coupon_code?`<p style="font-size:14px;"><strong>Coupon:</strong> ${order.coupon_code} (&#8722;&#8377;${Number(order.coupon_discount||0).toLocaleString('en-IN')})</p>`:''}
      <h3 style="font-size:14px;">Items:</h3>
      ${items.map(i=>`<p style="font-size:13px;color:#555;margin:4px 0;">&#8226; ${i.product_name} (${i.colour}) &times; ${i.quantity}</p>`).join('')}
      <div style="text-align:center;margin-top:20px;">
        <a href="${ADMIN_URL}/orders" style="background:#8B1A2B;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;">View in Admin Panel</a>
      </div>
    </div>
  </div>
</body></html>`
}

function shippingUpdateHtml(order: any, trackingId: string, courierName: string, brandName: string) {
  const addr = order.address_snapshot || order.shipping_address || {}
  return `<!DOCTYPE html><html>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#FDFAF7;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;">
    ${header(brandName)}
    <div style="padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">&#128666;</div>
      <h2 style="color:#1A1A1A;margin:0;font-family:Georgia,serif;">Your order is on the way!</h2>
      <p style="color:#5A4A3A;margin:12px 0;">Order #${String(order.id).slice(0,8).toUpperCase()} has been shipped</p>
      <div style="background:#F5EDE3;border-radius:8px;padding:20px;margin:20px 0;text-align:left;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Courier:</strong> ${courierName||'Our logistics partner'}</p>
        <p style="margin:0;font-size:14px;"><strong>Tracking ID:</strong> <span style="font-family:monospace;color:#8B1A2B;">${trackingId||'Will be shared soon'}</span></p>
      </div>
      <p style="color:#5A4A3A;font-size:14px;">Delivering to: <strong>${addr.full_name||''}</strong>, ${addr.city||''}</p>
      <p style="color:#3B82F6;font-size:13px;">Estimated delivery in 2&#8211;3 business days</p>
      <div style="text-align:center;margin-top:20px;">
        <a href="${SITE_URL}/orders/${order.id}" style="background:#8B1A2B;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;">Track Your Order</a>
      </div>
    </div>
    ${footer(brandName)}
  </div>
</body></html>`
}

function orderStatusUpdateHtml(order: any, newStatus: string, trackingId: string, courierName: string, brandName: string) {
  type StatusInfo = { emoji: string; heading: string; body: string; color: string }
  const statusMap: Record<string, StatusInfo> = {
    shipped: {
      emoji: '&#128666;',
      heading: 'Your order has been shipped!',
      body: `Your order is on its way.${trackingId ? ` Tracking ID: <strong>${trackingId}</strong>${courierName ? ` via ${courierName}` : ''}.` : ' Tracking details will be shared soon.'}`,
      color: '#1D4ED8',
    },
    delivered: {
      emoji: '&#9989;',
      heading: 'Order delivered!',
      body: 'Your order has been delivered. We hope you love your saree! Please leave a review if you have a moment.',
      color: '#15803D',
    },
    cancelled: {
      emoji: '&#10060;',
      heading: 'Order cancelled',
      body: 'Your order has been cancelled. If you paid online, a refund will be initiated within 5&#8211;7 business days to your original payment method.',
      color: '#DC2626',
    },
    return_approved: {
      emoji: '&#8617;&#65039;',
      heading: 'Return approved',
      body: 'Your return request has been approved. Please ship the item back to us. Once received and inspected, your refund will be processed within 5&#8211;7 business days.',
      color: '#9333EA',
    },
    return_rejected: {
      emoji: '&#9888;&#65039;',
      heading: 'Return request not approved',
      body: 'We were unable to approve your return request. This may be because the item does not meet our return criteria. Please contact our support team if you have questions.',
      color: '#DC2626',
    },
    refunded: {
      emoji: '&#128176;',
      heading: 'Refund processed',
      body: 'Your refund has been processed and will reflect in your original payment method within 5&#8211;7 business days.',
      color: '#15803D',
    },
  }
  const cfg: StatusInfo = statusMap[newStatus] || {
    emoji: '&#128230;',
    heading: 'Order update',
    body: `Your order status has been updated to: <strong>${newStatus}</strong>.`,
    color: '#8B1A2B',
  }

  return `<!DOCTYPE html><html>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#FDFAF7;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;">
    ${header(brandName)}
    <div style="padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">${cfg.emoji}</div>
      <h2 style="font-size:22px;font-weight:400;color:${cfg.color};margin:0 0 12px;font-family:Georgia,serif;">${cfg.heading}</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;">${cfg.body}</p>
      <div style="background:#F5EDE3;border-radius:6px;padding:14px;margin-bottom:24px;text-align:left;">
        <p style="margin:0;font-size:13px;">Order ID: <strong style="color:#8B1A2B;">#${String(order.id).slice(0,8).toUpperCase()}</strong></p>
        ${order.order_number ? `<p style="margin:4px 0 0;font-size:13px;">Order No: <strong>${order.order_number}</strong></p>` : ''}
        ${order.total_amount ? `<p style="margin:4px 0 0;font-size:13px;">Amount: <strong>&#8377;${Number(order.total_amount).toLocaleString('en-IN')}</strong></p>` : ''}
      </div>
      <a href="${SITE_URL}/orders/${order.id}" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">View Order Details</a>
    </div>
    ${footer(brandName)}
  </div>
</body></html>`
}

function contactMessageAdminHtml(name: string, email: string, message: string, brandName: string, phone = '') {
  return `<!DOCTYPE html><html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:24px 32px;">
      <h1 style="color:white;font-size:18px;font-weight:400;margin:0;">${brandName} &#8212; New Contact Message</h1>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#5A4A3A;font-size:13px;width:80px;">Name</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#1A1A1A;">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#5A4A3A;font-size:13px;">Email</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#8B1A2B;">${email}</a></td></tr>
        ${phone ? `<tr><td style="padding:8px 0;color:#5A4A3A;font-size:13px;">Phone</td><td style="padding:8px 0;font-size:14px;">${phone}</td></tr>` : ''}
      </table>
      <div style="background:#F5EDE3;border-radius:6px;padding:16px;margin-top:16px;">
        <p style="margin:0;font-size:14px;color:#1A1A1A;white-space:pre-wrap;">${message}</p>
      </div>
      <div style="margin-top:20px;">
        <a href="mailto:${email}?subject=Re: Your enquiry to ${brandName}" style="display:inline-block;padding:10px 20px;background:#8B1A2B;color:white;text-decoration:none;font-size:13px;border-radius:4px;">Reply to ${name}</a>
      </div>
    </div>
  </div>
</body></html>`
}

function contactAutoReplyHtml(name: string, brandName: string, siteUrl: string) {
  return `<!DOCTYPE html><html>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;">
    ${header(brandName)}
    <div style="padding:32px;">
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 12px;font-family:Georgia,serif;">Thank you, ${name}!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 16px;">We have received your message and will get back to you within 24 hours.</p>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 24px;">For urgent queries, feel free to WhatsApp us directly &#8212; we are happy to help!</p>
      <div style="text-align:center;">
        <a href="${siteUrl}/shop" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">Browse Our Collection</a>
      </div>
    </div>
    ${footer(brandName)}
  </div>
</body></html>`
}

function restockConfirmationHtml(productName: string, colour: string, brandName: string, siteUrl: string) {
  return `<!DOCTYPE html><html>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;">
    ${header(brandName)}
    <div style="padding:32px;">
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 12px;font-family:Georgia,serif;">You are on the waitlist!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;">We have added you to the waitlist for:</p>
      <div style="background:#FFF8F0;border-left:3px solid #C9A84C;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:500;color:#1A1A1A;">${productName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5A4A3A;">Colour: ${colour}</p>
      </div>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 24px;">As soon as this item is back in stock, you will be the first to know. We will send you an email with a direct link so you can grab it before it sells out again.</p>
      <div style="text-align:center;margin-bottom:20px;">
        <a href="${siteUrl}/shop" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">Browse Other Sarees</a>
      </div>
    </div>
    ${footer(brandName)}
  </div>
</body></html>`
}

function restockAvailableHtml(productName: string, colour: string, productUrl: string, brandName: string) {
  return `<!DOCTYPE html><html>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;">
    ${header(brandName)}
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="display:inline-block;background:#EAF6ED;color:#15803D;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:99px;">Back in Stock!</span>
      </div>
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 12px;font-family:Georgia,serif;">Great news &#8212; it is available again!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;">The saree you were waiting for is back in stock. Grab it before it sells out again!</p>
      <div style="background:#FFF8F0;border-left:3px solid #C9A84C;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:500;color:#1A1A1A;">${productName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5A4A3A;">Colour: ${colour}</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${productUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;box-shadow:0 4px 14px rgba(139,26,43,0.35);">Shop Now &#8594;</a>
      </div>
      <p style="font-size:12px;color:#9A8A7A;text-align:center;margin:0;">Hurry &#8212; limited stock available!</p>
    </div>
    ${footer(brandName)}
  </div>
</body></html>`
}

// ─────────────────────────────────────────────────────────────
// POST HANDLER
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      type,
      order,
      items,
      trackingId,
      courierName,
      customerEmail,
      productName,
      colour,
      productUrl,
      productSlug,
      name,
      message,
      phone,
      newStatus,
    } = body

    const { resend, adminEmail: ADMIN_EMAIL, fromEmail: FROM_EMAIL, apiKey: RESEND_KEY } = await getEmailConfig()
    const brandName = await getCfg('brand_name', process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store')
    const siteUrl   = await getCfg('setup_site_url', process.env.NEXT_PUBLIC_SITE_URL || SITE_URL)

    // Guard: fail fast with a clear error instead of silently sending to wrong address
    if (!RESEND_KEY) {
      return NextResponse.json({
        error: 'Email not configured. Set RESEND_API_KEY in Vercel env vars or the admin Config tab.',
      }, { status: 503 })
    }
    if (!FROM_EMAIL) {
      return NextResponse.json({
        error: 'FROM_EMAIL not configured. Set it in Vercel env vars or the admin Config → Setup tab.',
      }, { status: 503 })
    }

    // ── 1. ORDER CONFIRMATION ─────────────────────────────────
    if (type === 'order_confirmation') {
      if (!customerEmail) return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Order Confirmed! #${String(order.id).slice(0,8).toUpperCase()} — ${brandName}`,
        html: orderConfirmationHtml(order, items || [], brandName),
      })
      if (ADMIN_EMAIL) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `New Order #${String(order.id).slice(0,8).toUpperCase()} — ₹${Number(order.total_amount).toLocaleString('en-IN')}`,
          html: adminOrderNotificationHtml(order, items || []),
        })
      }
      return NextResponse.json({ success: true })
    }

    // ── 2. SHIPPING UPDATE ────────────────────────────────────
    if (type === 'shipping_update') {
      if (!customerEmail) return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `Your order has been shipped! #${String(order.id).slice(0,8).toUpperCase()} — ${brandName}`,
        html: shippingUpdateHtml(order, trackingId || '', courierName || '', brandName),
      })
      return NextResponse.json({ success: true })
    }

    // ── 3. ORDER STATUS UPDATE (shipped/delivered/cancelled/return_approved) ──
    if (type === 'order_status_update') {
      if (!customerEmail) return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
      const subjectMap: Record<string, string> = {
        shipped:        `Your order has been shipped! #${String(order?.id||'').slice(0,8).toUpperCase()}`,
        delivered:      `Your order has been delivered! #${String(order?.id||'').slice(0,8).toUpperCase()}`,
        cancelled:      `Order cancelled #${String(order?.id||'').slice(0,8).toUpperCase()}`,
        return_approved:`Your return has been approved #${String(order?.id||'').slice(0,8).toUpperCase()}`,
      }
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: (subjectMap[newStatus] || `Order update — ${brandName}`) + ` — ${brandName}`,
        html: orderStatusUpdateHtml(order || {}, newStatus || '', trackingId || '', courierName || '', brandName),
      })
      return NextResponse.json({ success: true })
    }

    // ── 4. CONTACT FORM: auto-reply to customer + notify admin ──
    if (type === 'contact_message') {
      const contactEmail = customerEmail || order?.email
      if (contactEmail) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: contactEmail,
          subject: `We received your message — ${brandName}`,
          html: contactAutoReplyHtml(name || 'there', brandName, siteUrl),
        })
      }
      if (ADMIN_EMAIL) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `New contact message from ${name || contactEmail || 'a visitor'} — ${brandName}`,
          html: contactMessageAdminHtml(name || '', contactEmail || '', message || '', brandName, phone || ''),
        })
      }
      return NextResponse.json({ success: true })
    }

    // ── 5. RESTOCK CONFIRMATION (customer registers for waitlist) ──
    if (type === 'restock_confirmation') {
      if (!customerEmail) return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `You are on the waitlist for ${productName || 'a saree'} — ${brandName}`,
        html: restockConfirmationHtml(productName || '', colour || '', brandName, siteUrl),
      })
      return NextResponse.json({ success: true })
    }

    // ── 6. RESTOCK AVAILABLE (item back in stock, notify waiter) ──
    if (type === 'restock_available') {
      if (!customerEmail) return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
      const fullUrl = productUrl || (productSlug ? `${siteUrl}/product/${productSlug}` : `${siteUrl}/shop`)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: `${productName || 'Your saved item'} is back in stock! — ${brandName}`,
        html: restockAvailableHtml(productName || '', colour || '', fullUrl, brandName),
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type: ' + type }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
