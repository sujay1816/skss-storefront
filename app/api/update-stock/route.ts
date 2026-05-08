import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, items } = body

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

        const { data: allVariants } = await supabase
          .from('product_variants').select('stock').eq('product_id', item.product_id)

        if (allVariants) {
          const totalStock = allVariants.reduce((s: number, v: any) => s + v.stock, 0)
          await supabase.from('products').update({ stock: totalStock }).eq('id', item.product_id)
        }
      }
      return NextResponse.json({ success: true, message: 'Stock restored' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
