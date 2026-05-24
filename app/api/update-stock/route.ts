import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getCfg } from '@/lib/get-config'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skss-storefront.vercel.app'

// Send restock emails to all customers waiting for this product+colour
// Uses Resend directly (not a self-HTTP-call) so it works even when NEXT_PUBLIC_SITE_URL is unset.
async function notifyRestockWaiters(supabase: any, productId: string, colour: string) {
  try {
    const { data: requests } = await supabase
      .from('restock_requests')
      .select('email, products(name, slug)')
      .eq('product_id', productId)
      .eq('colour', colour)

    if (!requests || requests.length === 0) return

    const productName = (requests[0]?.products as any)?.name || 'Your saved item'
    const productSlug = (requests[0]?.products as any)?.slug || ''
    const productUrl  = productSlug ? `${SITE_URL}/product/${productSlug}` : `${SITE_URL}/shop`

    // Fetch config directly
    const [apiKey, fromEmail, brandName] = await Promise.all([
      getCfg('setup_resend_api_key', process.env.RESEND_API_KEY),
      getCfg('setup_from_email',     process.env.FROM_EMAIL || ''),
      getCfg('brand_name',           process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'),
    ])

    if (!apiKey || !fromEmail) return  // email not configured — skip silently

    const resend = new Resend(apiKey)

    for (const req of requests) {
      if (!req.email) continue
      await resend.emails.send({
        from: fromEmail,
        to: req.email,
        subject: `${productName} is back in stock! — ${brandName}`,
        html: restockAvailableEmailHtml(productName, colour, productUrl, brandName),
      }).catch(() => {})
    }

    // Delete fulfilled requests so customers are not emailed again on next restock
    await supabase
      .from('restock_requests')
      .delete()
      .eq('product_id', productId)
      .eq('colour', colour)
  } catch {}
}

function restockAvailableEmailHtml(productName: string, colour: string, productUrl: string, brandName: string): string {
  return `<!DOCTYPE html><html>
<body style="margin:0;padding:0;background:#FDFAF7;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#8B1A2B,#6B1220);padding:28px 32px;text-align:center;">
      <h1 style="color:white;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif;">${brandName}</h1>
      <p style="color:#C9A84C;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:4px 0 0;">✦ SILKS &amp; SAREES ✦</p>
    </div>
    <div style="padding:32px;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="display:inline-block;background:#EAF6ED;color:#15803D;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:99px;">Back in Stock!</span>
      </div>
      <h2 style="font-size:20px;font-weight:400;color:#1A1A1A;margin:0 0 12px;font-family:Georgia,serif;text-align:center;">Great news &#8212; it is available again!</h2>
      <p style="font-size:14px;color:#5A4A3A;line-height:1.7;margin:0 0 20px;text-align:center;">The saree you were waiting for is back in stock. Grab it before it sells out!</p>
      <div style="background:#FFF8F0;border-left:3px solid #C9A84C;padding:14px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:500;color:#1A1A1A;">${productName}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5A4A3A;">Colour: ${colour}</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${productUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8B1A2B,#6B1220);color:white;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;border-radius:4px;">Shop Now &#8594;</a>
      </div>
      <p style="font-size:12px;color:#9A8A7A;text-align:center;margin:0;">Hurry &#8212; limited stock available!</p>
    </div>
    <div style="background:#1A1A1A;padding:16px 32px;text-align:center;">
      <p style="color:#C9A84C;margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">${brandName}</p>
    </div>
  </div>
</body></html>`
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
