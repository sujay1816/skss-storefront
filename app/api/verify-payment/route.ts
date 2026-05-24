import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getCfg } from '@/lib/get-config'

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
    const keySecret = await getCfg('setup_razorpay_key_secret', process.env.RAZORPAY_KEY_SECRET)
    if (!keySecret) return NextResponse.json({ verified: false }, { status: 400 })
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
    // Use timingSafeEqual to prevent timing attacks on HMAC comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    )
    if (isValid) return NextResponse.json({ verified: true })
    return NextResponse.json({ verified: false }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
