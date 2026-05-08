import { NextResponse } from 'next/server'

const FAST2SMS_KEY = process.env.FAST2SMS_API_KEY!

async function sendWhatsApp(phone: string, message: string) {
  // Clean phone number - remove country code, spaces, dashes
  const clean = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10)
  if (clean.length !== 10) {
    console.error('Invalid phone number:', phone, '→', clean)
    return { success: false, error: 'Invalid phone number' }
  }

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': FAST2SMS_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q', // Quick transactional route
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
    const { type, order, phone, trackingId, courierName } = await request.json()

    if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

    let message = ''

    if (type === 'order_placed') {
      const addr = order.address_snapshot || order.shipping_address || {}
      message = `Dear ${addr.full_name || 'Customer'},\n\nYour order has been confirmed!\n\nOrder ID: #${String(order.id).slice(0, 8).toUpperCase()}\nTotal: Rs.${Number(order.total_amount).toLocaleString('en-IN')}\nPayment: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}\n\nEstimated delivery: 5-7 business days.\n\nThank you for shopping with Sai Krishna Silks & Sarees!\n\nFor queries, WhatsApp us at ${process.env.NEXT_PUBLIC_WHATSAPP || '+919999999999'}`
    }

    if (type === 'order_shipped') {
      const addr = order.address_snapshot || order.shipping_address || {}
      message = `Dear ${addr.full_name || 'Customer'},\n\nGreat news! Your order #${String(order.id).slice(0, 8).toUpperCase()} has been shipped!\n\nCourier: ${courierName}\nTracking ID: ${trackingId}\n\nYour saree is on its way! Estimated delivery in 2-3 days.\n\nThank you for shopping with Sai Krishna Silks & Sarees!`
    }

    if (!message) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    const result = await sendWhatsApp(phone, message)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('WhatsApp error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
