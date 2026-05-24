import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCfg } from '@/lib/get-config'

// Send restock emails to all customers waiting for this product+colour
async function notifyRestockWaiters(supabase: any, productId: string, colour: string) {
  try {
    // Get all waiting requests for this product+colour
    const { data: requests } = await supabase
      .from('restock_requests')
      .select('email, products(name, slug)')
      .eq('product_id', productId)
      .eq('colour', colour)

    if (!requests || requests.length === 0) return

    const productName = (requests[0]?.products as any)?.name || 'Your saved item'
    const productSlug = (requests[0]?.products as any)?.slug || ''

    // Send email to each waiting customer
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    for (const req of requests) {
      if (!req.email) continue
      await fetch(`${siteUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'restock_available',
          customerEmail: req.email,
          productName,
          colour,
          productSlug,
        }),
      }).catch(() => {})
    }

    // Delete fulfilled restock requests so they don't get emailed again next time
    await supabase
      .from('restock_requests')
      .delete()
      .eq('product_id', productId)
      .eq('colour', colour)
  } catch {}
}


export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const secret = request.headers.get('x-internal-secret')
  const expectedSecret = await getCfg('setup_internal_api_secret', process.env.INTERNAL_API_SECRET)
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { type, items } = await request.json()
    if (type === 'deduct') {
      for (const item of items) {
        const { error } = await supabase.rpc('deduct_stock', {
          p_product_id: item.product_id, p_colour: item.colour, p_quantity: item.quantity,
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }
    if (type === 'restore') {
      for (const item of items) {
        const { error } = await supabase.rpc('restore_stock', {
          p_product_id: item.product_id, p_colour: item.colour, p_quantity: item.quantity,
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // After restoring stock, notify waiting customers (non-blocking)
        notifyRestockWaiters(supabase, item.product_id, item.colour).catch(() => {})
      }
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
