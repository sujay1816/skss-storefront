import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getCfg } from '@/lib/get-config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel cron security — always verify
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [apiKey, fromEmail, brandName, siteUrl, fast2smsKey] = await Promise.all([
      getCfg('setup_resend_api_key', process.env.RESEND_API_KEY),
      getCfg('setup_from_email',     process.env.FROM_EMAIL || ''),
      getCfg('brand_name',           process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'),
      getCfg('setup_site_url',       process.env.NEXT_PUBLIC_SITE_URL || ''),
      getCfg('setup_fast2sms_key',   process.env.FAST2SMS_API_KEY || ''),
    ])

    // Carts updated between 2h ago and 25h ago (daily job catches the 2h window per day)
    const twoHoursAgo  = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const twentyFiveH  = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

    const { data: cartRows } = await sb
      .from('carts')
      .select('user_id, product_id, colour, quantity, updated_at, profiles(full_name, email, phone)')
      .lt('updated_at', twoHoursAgo)
      .gt('updated_at', twentyFiveH)

    if (!cartRows || cartRows.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No abandoned carts' })
    }

    // Group by user
    const byUser: Record<string, { profile: any; items: any[] }> = {}
    for (const row of cartRows) {
      if (!row.user_id) continue
      if (!byUser[row.user_id]) byUser[row.user_id] = { profile: (row as any).profiles, items: [] }
      byUser[row.user_id].items.push(row)
    }

    // Exclude users who placed an order in the last 25h
    const { data: recentOrders } = await sb.from('orders').select('user_id').gt('created_at', twentyFiveH)
    const completedUsers = new Set((recentOrders || []).map((o: any) => o.user_id))

    let sent = 0
    const resend = apiKey ? new Resend(apiKey) : null

    for (const [userId, data] of Object.entries(byUser)) {
      if (completedUsers.has(userId)) continue
      const { profile, items } = data
      const email = profile?.email
      const phone = profile?.phone
      const name  = profile?.full_name?.split(' ')[0] || 'there'
      const cartUrl = `${siteUrl}/cart`

      if (email && resend && fromEmail) {
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `${name}, you left something behind \u2014 ${brandName}`,
          html: abandonedCartHtml(name, items, cartUrl, brandName),
        }).catch(() => {})
      }

      if (phone && fast2smsKey) {
        const clean = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10)
        if (clean.length === 10) {
          const msg = `Hi ${name}! You have ${items.length} item${items.length > 1 ? 's' : ''} waiting in your cart at ${brandName}. Complete your order: ${cartUrl}`
          await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: { authorization: fast2smsKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ route: 'q', message: msg, language: 'english', flash: 0, numbers: clean }),
          }).catch(() => {})
        }
      }
      sent++
    }

    return NextResponse.json({ sent, message: `Sent ${sent} abandoned cart reminders` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function abandonedCartHtml(name: string, items: any[], cartUrl: string, brandName: string): string {
  const itemsHtml = items.slice(0, 3).map(item =>
    `<div style="padding:10px 0;border-bottom:1px solid #F0EAE2;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#1A1A1A;">${item.colour || 'Saree'} &mdash; Qty: ${item.quantity}</p>
    </div>`
  ).join('')
  const extra = items.length > 3 ? `<p style="font-size:12px;color:#9A8A7A;margin:8px 0 0;">+${items.length - 3} more item(s)</p>` : ''

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FDFAF7;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;border:1px solid #E8DDD4;">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:28px 32px;text-align:center;">
      <h1 style="color:white;font-size:22px;font-weight:300;margin:0;">${brandName}</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 8px;">${name}, your cart is waiting!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;">You left some beautiful sarees in your cart. They are still available &mdash; but stock is limited!</p>
      <div style="background:#FDFAF7;border-radius:6px;padding:16px;margin-bottom:24px;">${itemsHtml}${extra}</div>
      <div style="text-align:center;">
        <a href="${cartUrl}" style="display:inline-block;padding:14px 32px;background:#8B1A2B;color:white;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">
          Complete My Order &rarr;
        </a>
      </div>
    </div>
    <div style="background:#1A1A1A;padding:16px 32px;text-align:center;">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">${brandName}</p>
    </div>
  </div>
</body></html>`
}
