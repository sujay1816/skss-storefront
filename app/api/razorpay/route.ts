import { NextRequest, NextResponse } from 'next/server'
import { getCfg } from '@/lib/get-config'

export async function POST(req: NextRequest) {
  const { amount } = await req.json()
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
  return NextResponse.json({ orderId: data.id, amount: data.amount, currency: data.currency, key: keyId })
}
