import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'
import { getCfg } from '@/lib/get-config'

async function getServerTotal(userId: string): Promise<number | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: cartItems, error } = await supabase
      .from('carts')
      .select('quantity, colour, original_price, sale_price, gst_rate, product_id')
      .eq('user_id', userId)

    if (error || !cartItems || cartItems.length === 0) return null

    const { data: configRows } = await supabase
      .from('site_config').select('key, value')
      .in('key', ['default_shipping_charge', 'free_shipping_above'])
    const cfg: Record<string, number> = {}
    configRows?.forEach((r: any) => { cfg[r.key] = Number(r.value) })
    const shippingCharge = cfg.default_shipping_charge ?? 99
    const freeShippingAbove = cfg.free_shipping_above ?? 2500

    let subtotal = 0, gstTotal = 0
    for (const item of cartItems as any[]) {
      const price = item.sale_price ?? item.original_price ?? 0
      subtotal += price * item.quantity
      gstTotal += Math.round(price * item.quantity * ((item.gst_rate ?? 5) / 100))
    }
    const shipping = subtotal >= freeShippingAbove ? 0 : shippingCharge
    return Math.max(0, subtotal + shipping + gstTotal)
  } catch { return null }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { receipt, clientAmount } = await request.json()

    // Read keys from site_config first, fall back to process.env
    const keyId     = await getCfg('setup_razorpay_key_id',     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
    const keySecret = await getCfg('setup_razorpay_key_secret', process.env.RAZORPAY_KEY_SECRET)

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const serverTotal = await getServerTotal(user.id)
    let amountToCharge: number

    if (serverTotal !== null) {
      amountToCharge = serverTotal
      if (clientAmount && Math.abs(clientAmount - serverTotal) > serverTotal * 0.05 + 1) {
        return NextResponse.json({ error: 'Order total mismatch. Please refresh and try again.' }, { status: 400 })
      }
    } else {
      amountToCharge = clientAmount
    }

    if (!amountToCharge || amountToCharge <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amountToCharge * 100),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
    })
    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
