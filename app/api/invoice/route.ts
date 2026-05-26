import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCfg } from '@/lib/get-config'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import InvoiceDocument from '@/components/InvoiceDocument'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const token   = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    // Auth: verify the user owns this order
    const anonSb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await anonSb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch order
    const { data: order } = await sb.from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Fetch items
    const { data: items } = await sb.from('order_items')
      .select('product_name, colour, quantity, sale_price, original_price, total')
      .eq('order_id', orderId)

    // Fetch brand config
    const [brandName, brandEmail, storeGstin, storeAddress, logoUrl] = await Promise.all([
      getCfg('brand_name',         process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'),
      getCfg('setup_admin_email',  process.env.ADMIN_EMAIL || ''),
      getCfg('store_gstin',        ''),
      getCfg('business_address',   ''),
      getCfg('logo_url',           ''),
    ])

    const pdfBuffer = await renderToBuffer(
      createElement(InvoiceDocument, {
        order,
        items: items || [],
        brandName,
        brandEmail,
        storeGstin,
        storeAddress,
        logoUrl,
      })
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${String(orderId).slice(0,8).toUpperCase()}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
