import { NextResponse } from 'next/server'

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY!

async function sendSMS(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10)
  if (clean.length !== 10) {
    return { success: false, error: 'Invalid phone number' }
  }

  if (!FAST2SMS_KEY) {
    return { success: false, error: 'API key not configured' }
  }


  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': FAST2SMS_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: clean,
    })
  })

  const data = await res.json()
  return { success: data.return === true, data }
}

export async function POST(request: Request) {
  try {
    // Require x-internal-secret to prevent abuse — only admin or internal services call this
    const { createClient: createSB } = await import('@supabase/supabase-js')
    const sb = createSB(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: secretCfg } = await sb.from('site_config').select('value').eq('key', 'setup_internal_api_secret').maybeSingle()
    const expectedSecret = (secretCfg as any)?.value || process.env.INTERNAL_API_SECRET || ''
    const providedSecret = request.headers.get('x-internal-secret') || ''
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, order, phone, trackingId, courierName } = await request.json()

    let brandName = 'Sai Krishna Silks & Sarees'
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data } = await sb.from('site_config').select('value').eq('key', 'brand_name').single()
      if (data?.value) brandName = data.value
    } catch {}

    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

    let message = ''

    if (type === 'order_placed') {
      const orderId = String(order.id).slice(0, 8).toUpperCase()
      const total = Number(order.total_amount).toLocaleString('en-IN')
      const payment = order.payment_method === 'cod' ? 'COD' : 'Paid Online'
      // Keep message short and single-line friendly for SMS route
      message = `Order confirmed! ID: #${orderId} | Total: Rs.${total} | Payment: ${payment} | Delivery in 5-7 days. Thank you for shopping with ${brandName}!`
    }

    if (type === 'order_shipped') {
      const orderId = String(order.id).slice(0, 8).toUpperCase()
      message = `Your ${brandName} order #${orderId} is shipped! Courier: ${courierName} | Tracking: ${trackingId}. Delivery in 2-3 days.`
    }

    if (!message) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    const result = await sendSMS(phone, message)
    return NextResponse.json(result)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
