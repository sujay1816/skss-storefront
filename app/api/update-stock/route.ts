import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { type, items } = await request.json()

    if (type === 'deduct') {
      for (const item of items) {
        const { data: variant } = await supabase
          .from('product_variants').select('stock')
          .eq('product_id', item.product_id).eq('colour', item.colour).single()
        if (variant) {
          await supabase.from('product_variants')
            .update({ stock: Math.max(0, variant.stock - item.quantity) })
            .eq('product_id', item.product_id).eq('colour', item.colour)
        }
        const { data: all } = await supabase
          .from('product_variants').select('stock').eq('product_id', item.product_id)
        if (all) {
          await supabase.from('products')
            .update({ stock: all.reduce((s: number, v: any) => s + v.stock, 0) })
            .eq('id', item.product_id)
        }
      }
      return NextResponse.json({ success: true })
    }

    if (type === 'restore') {
      for (const item of items) {
        const { data: variant } = await supabase
          .from('product_variants').select('stock')
          .eq('product_id', item.product_id).eq('colour', item.colour).single()
        if (variant) {
          await supabase.from('product_variants')
            .update({ stock: variant.stock + item.quantity })
            .eq('product_id', item.product_id).eq('colour', item.colour)
        }
        const { data: all } = await supabase
          .from('product_variants').select('stock').eq('product_id', item.product_id)
        if (all) {
          await supabase.from('products')
            .update({ stock: all.reduce((s: number, v: any) => s + v.stock, 0) })
            .eq('id', item.product_id)
        }
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
