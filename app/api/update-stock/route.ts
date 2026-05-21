import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCfg } from '@/lib/get-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
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
      }
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
