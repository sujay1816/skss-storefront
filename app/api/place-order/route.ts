import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCfg } from '@/lib/get-config'

// Single server-side route that handles the complete order flow:
// 1. Validate auth
// 2. Lock stock rows (FOR UPDATE) — prevents race conditions
// 3. Check stock availability for every item
// 4. Create order + order_items
// 5. Deduct stock atomically
// All in one DB transaction — two simultaneous orders can never both succeed if stock = 1

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

    const body = await request.json()
    const {
      items,          // CartItem[]
      addressData,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      subtotal,
      shipping,
      gst,
      total,
      couponCode,
      couponDiscount,
      orderPrefix,
    } = body

    if (!items?.length) return NextResponse.json({ error: 'No items in order' }, { status: 400 })

    // ── Step 1: Lock and check stock for all items atomically ──
    // Use the place_order RPC which runs inside a Postgres transaction
    const orderNumber = `${orderPrefix || 'ORD'}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(16).slice(2,6).toUpperCase()}`

    const { data: result, error: rpcError } = await supabase.rpc('place_order_atomic', {
      p_user_id:            user.id,
      p_order_number:       orderNumber,
      p_status:             'confirmed',
      p_payment_status:     paymentMethod === 'cod' ? 'pending' : 'paid',
      p_payment_method:     paymentMethod === 'cod' ? 'cod' : 'razorpay',
      p_razorpay_order_id:  razorpayOrderId || null,
      p_razorpay_payment_id: razorpayPaymentId || null,
      p_subtotal:           subtotal,
      p_shipping_charge:    shipping,
      p_total_gst:          gst,
      p_total_amount:       total,
      p_coupon_code:        couponCode || null,
      p_coupon_discount:    couponDiscount || 0,
      p_address_snapshot:   addressData,
      p_items:              items.map((item: any) => ({
        product_id:     item.productId,
        product_name:   item.productName,
        product_image:  item.productImage || '',
        colour:         item.colour,
        quantity:       item.quantity,
        original_price: item.originalPrice,
        sale_price:     item.salePrice ?? item.originalPrice,
        gst_rate:       item.gstRate,
        gst_amount:     Math.round((item.salePrice ?? item.originalPrice) * item.quantity * (item.gstRate / 100)),
        total:          (item.salePrice ?? item.originalPrice) * item.quantity,
      })),
    })

    if (rpcError) {
      // RPC raises exceptions with meaningful messages for out-of-stock
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    // Increment coupon usage if applicable
    if (couponCode) {
      try { await supabase.rpc('increment_coupon_usage', { coupon_code: couponCode }) } catch {}
    }

    return NextResponse.json({ success: true, orderId: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
