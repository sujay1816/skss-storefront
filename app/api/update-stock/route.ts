import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type, items } = await request.json()

    if (type === 'deduct') {
      // Fix #2 — use atomic RPC instead of read-then-write
      // Old pattern: read stock → calculate new value → write
      // Race condition: two orders could both read stock=1, both pass,
      // both write stock=0, resulting in -1 effective stock (oversell)
      // New pattern: single SQL UPDATE stock = stock - quantity (atomic)
      for (const item of items) {
        const { error } = await supabase.rpc('deduct_stock', {
          p_product_id: item.product_id,
          p_colour: item.colour,
          p_quantity: item.quantity,
        })
        if (error) {
          console.error('deduct_stock error:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
      return NextResponse.json({ success: true })
    }

    if (type === 'restore') {
      // Fix #2 — atomic restore too
      for (const item of items) {
        const { error } = await supabase.rpc('restore_stock', {
          p_product_id: item.product_id,
          p_colour: item.colour,
          p_quantity: item.quantity,
        })
        if (error) {
          console.error('restore_stock error:', error.message)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
