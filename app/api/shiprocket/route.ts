import { NextRequest, NextResponse } from 'next/server'
import { getCfg } from '@/lib/get-config'

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get('pincode')
  if (!pincode) return NextResponse.json({ available: false })
  const email    = await getCfg('shiprocket_email',          process.env.SHIPROCKET_EMAIL)
  const password = await getCfg('setup_shiprocket_password', process.env.SHIPROCKET_PASSWORD)
  if (!email || !password) {
    const eta = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    return NextResponse.json({ available: true, message: `Estimated delivery by ${eta}` })
  }
  try {
    const loginRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const { token } = await loginRes.json()
    const checkRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=500001&delivery_postcode=${pincode}&cod=1&weight=0.5`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await checkRes.json()
    const available = data.status === 200 && (data.data?.available_courier_companies?.length || 0) > 0
    const eta = data.data?.available_courier_companies?.[0]?.estimated_delivery_days || 7
    return NextResponse.json({ available, message: `Estimated delivery in ${eta} days` })
  } catch {
    return NextResponse.json({ available: true, message: 'Delivery available (7-10 days)' })
  }
}
