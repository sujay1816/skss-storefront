import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCfg } from '@/lib/get-config'

export async function POST(req: NextRequest) {
  // Auth check — prevent unauthenticated Razorpay order creation
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const { amount } = await req.json()
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const keyId     = await getCfg('setup_razorpay_key_id',     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
    const keySecret = await getCfg('setup_razorpay_key_secret', process.env.RAZORPAY_KEY_SECRET)
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', payment_capture: 1 })
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.error?.description || 'Razorpay error' }, { status: 502 })
    return NextResponse.json({ orderId: data.id, amount: data.amount, currency: data.currency, key: keyId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
