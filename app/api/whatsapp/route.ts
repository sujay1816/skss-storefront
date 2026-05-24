import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Require x-internal-secret — prevents public abuse of SMS sending
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: secretCfg } = await supabaseAuth.from('site_config').select('value').eq('key', 'setup_internal_api_secret').maybeSingle()
  const expectedSecret = (secretCfg as any)?.value || process.env.INTERNAL_API_SECRET || ''
  const providedSecret = req.headers.get('x-internal-secret') || ''
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
  const { orderId, phone, orderNumber, trackingId, courierName } = await req.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: cfg } = await supabase.from('site_config').select('key,value').in('key', ['fast2sms_key', 'brand_name'])
  const config: Record<string, string> = {}
  cfg?.forEach((c: any) => { config[c.key] = c.value })
  const apiKey = config.fast2sms_key
  if (!apiKey) return NextResponse.json({ success: false, error: 'Fast2SMS not configured' })
  const message = `Your ${config.brand_name || 'SKSS'} order ${orderNumber} has been shipped! Tracking: ${courierName} - ${trackingId}. Track your order at skss.in/orders`
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'q', message, language: 'english', flash: 0, numbers: phone.replace(/\D/g, '').slice(-10) })
  })
  const data = await res.json()
  if (data.return) {
    await supabase.from('orders').update({ whatsapp_sent: true }).eq('id', orderId)
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ success: false, error: data.message })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
