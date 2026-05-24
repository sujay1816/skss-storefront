import { createClient } from './server'
import { cache } from 'react'
import type { SiteConfig, Category, Product, ProductImage, ProductVariant, Banner, Review, Order, OrderItem, Address } from '@/types'

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const supabase = createClient()
  const { data } = await supabase.from('site_config').select('key, value')
  const config: SiteConfig = {} as SiteConfig
  if (data) data.forEach(row => { config[row.key] = row.value })
  return config
})

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = createClient()
  const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order')
  return (data || []).map(r => ({
    id: r.id, name: r.name, slug: r.slug, description: r.description || '',
    imageUrl: r.image_url || '', isActive: r.is_active, displayOrder: r.display_order
  }))
})

function mapImage(r: any): ProductImage {
  return { id: r.id, url: r.url, publicId: r.public_id || '', altText: r.alt_text || '', isPrimary: r.is_primary, order: r.order_index }
}
function mapVariant(r: any): ProductVariant {
  return { id: r.id, colour: r.colour, colourHex: r.colour_hex, stock: r.stock, sku: r.sku || '', imageUrl: r.image_url || null }
}
function mapProduct(r: any): Product {
  const variants = (r.product_variants || []).map(mapVariant)
  const images = (r.product_images || []).sort((a: any, b: any) => a.order_index - b.order_index).map(mapImage)
  const totalStock = variants.reduce((s: number, v: ProductVariant) => s + v.stock, 0)
  const newArrivalDays = 30
  const isNew = new Date(r.created_at) > new Date(Date.now() - newArrivalDays * 86400000)
  return {
    id: r.id, name: r.name, slug: r.slug, description: r.description || '',
    fabric: r.fabric || '', weaveType: r.weave_type || '', originRegion: r.origin_region || '',
    occasion: r.occasion || [], careInstructions: r.care_instructions || 'Dry clean only',
    blouseIncluded: r.blouse_included || false, length: r.length || 5.5, weightGrams: r.weight_grams || 0,
    category: r.categories?.slug || '', categorySlug: r.categories?.slug || '', categoryName: r.categories?.name || '',
    originalPrice: r.original_price, salePrice: r.sale_price || null,
    discountPercent: r.discount_percent || null, saleStartDate: r.sale_start_date || null, saleEndDate: r.sale_end_date || null,
    gstRate: r.gst_rate || 5, images, variants, totalStock, isOutOfStock: totalStock === 0,
    isNew, isFeatured: r.is_featured || false, isBestseller: r.is_bestseller || false,
    customFields: r.custom_fields || {}, averageRating: r.average_rating || 0, reviewCount: r.review_count || 0,
    createdAt: r.created_at, updatedAt: r.updated_at, videoUrl: r.video_url || null
  }
}

const PRODUCT_SELECT = `*, categories(slug, name), product_images(id,url,public_id,alt_text,is_primary,order_index), product_variants(id,colour,colour_hex,stock,sku,image_url)`

// Server-side filter params — all filtering done in Postgres, not in JS
export interface ProductFilters {
  categorySlug?: string
  category?: string
  search?: string
  featured?: boolean
  bestseller?: boolean
  newArrivals?: boolean
  // Scalability filters — pushed to DB so 200+ sarees never slow the browser
  fabrics?: string[]
  occasions?: string[]
  priceMin?: number
  priceMax?: number
  onlyInStock?: boolean
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount'
  limit?: number
  offset?: number        // for server-side pagination
}

export async function getProducts(filters?: ProductFilters): Promise<{ products: Product[]; total: number }> {
  const supabase = createClient()

  // Use count:'exact' so we can paginate without a second query
  let q = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)

  // ── Category ──────────────────────────────────────────────────────────────
  const categorySlug = filters?.categorySlug || filters?.category
  if (categorySlug) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
    if (cat) q = q.eq('category_id', cat.id)
  }

  // ── Boolean flags ─────────────────────────────────────────────────────────
  if (filters?.featured)    q = q.eq('is_featured', true)
  if (filters?.bestseller)  q = q.eq('is_bestseller', true)
  if (filters?.newArrivals) {
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
    q = q.gte('created_at', cutoff)
  }

  // ── Search — name + fabric + origin (full text via ilike) ─────────────────
  if (filters?.search) {
    const s = `%${filters.search}%`
    q = q.or(`name.ilike.${s},fabric.ilike.${s},origin_region.ilike.${s}`)
  }

  // ── Fabric filter (OR within fabrics, AND with everything else) ───────────
  if (filters?.fabrics?.length) {
    q = q.in('fabric', filters.fabrics)
  }

  // ── Occasion filter (array overlap) ───────────────────────────────────────
  if (filters?.occasions?.length) {
    q = q.overlaps('occasion', filters.occasions)
  }

  // ── Price range ───────────────────────────────────────────────────────────
  // Uses sale_price when available, otherwise original_price
  // Postgres: COALESCE(sale_price, original_price) with gte/lte
  if (filters?.priceMin !== undefined) {
    q = q.or(`sale_price.gte.${filters.priceMin},and(sale_price.is.null,original_price.gte.${filters.priceMin})`)
  }
  if (filters?.priceMax !== undefined) {
    q = q.or(`sale_price.lte.${filters.priceMax},and(sale_price.is.null,original_price.lte.${filters.priceMax})`)
  }

  // ── Stock ─────────────────────────────────────────────────────────────────
  // Note: is_out_of_stock is a computed column or we filter by total_stock > 0
  // Keeping it simple: filter handled client-side for in-stock (no DB column)
  // because stock is per-variant, not at product level in the DB.

  // ── Sort ──────────────────────────────────────────────────────────────────
  switch (filters?.sortBy) {
    case 'price_asc':  q = q.order('original_price', { ascending: true });  break
    case 'price_desc': q = q.order('original_price', { ascending: false }); break
    case 'rating':     q = q.order('average_rating', { ascending: false });  break
    case 'discount':   q = q.order('discount_percent', { ascending: false, nullsFirst: false }); break
    default:           q = q.order('created_at', { ascending: false });      break
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const limit  = filters?.limit  ?? 16
  const offset = filters?.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) { return { products: [], total: 0 } }
  return { products: (data || []).map(mapProduct), total: count ?? 0 }
}

// Backwards-compatible wrapper for homepage sections (featured/bestsellers/new arrivals)
// These don't need pagination or scalability fixes since they always fetch ≤8 items
export async function getProductsSimple(filters?: {
  categorySlug?: string; category?: string; search?: string
  featured?: boolean; bestseller?: boolean; newArrivals?: boolean; limit?: number
}): Promise<Product[]> {
  const result = await getProducts({ ...filters, limit: filters?.limit ?? 8 })
  return result.products
}
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).single()
  if (error || !data) return null
  return mapProduct(data)
}

export async function getRelatedProducts(categorySlug: string, excludeSlug: string): Promise<Product[]> {
  const supabase = createClient()
  const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
  if (!cat) return []
  const { data } = await supabase.from('products').select(PRODUCT_SELECT).eq('category_id', cat.id).eq('is_active', true).neq('slug', excludeSlug).limit(4)
  return (data || []).map(mapProduct)
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  const supabase = createClient()
  const { data } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url)').eq('product_id', productId).eq('is_approved', true).order('created_at', { ascending: false })
  return (data || []).map((r: any) => ({
    id: r.id, productId, userId: r.user_id, userFullName: r.profiles?.full_name || 'Anonymous',
    userAvatarUrl: r.profiles?.avatar_url || null, rating: r.rating, comment: r.comment || '', isVerifiedPurchase: r.is_verified_purchase, createdAt: r.created_at
  }))
}

export async function getBanners(): Promise<Banner[]> {
  const supabase = createClient()
  const { data } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order')
  return (data || []).map((r: any) => {
    // Parse legacy video_urls
    let videoUrls: string[] = []
    try {
      if (r.video_urls) videoUrls = JSON.parse(r.video_urls).filter(Boolean)
      else if (r.video_url) videoUrls = [r.video_url]
    } catch { if (r.video_url) videoUrls = [r.video_url] }

    // Parse slides — validate each slide has at least imageUrl or videoUrl
    let slides: any[] = []
    try {
      if (r.slides) {
        const parsed = JSON.parse(r.slides)
        if (Array.isArray(parsed)) {
          slides = parsed.filter((s: any) =>
            s && typeof s === 'object' && (s.imageUrl || s.videoUrl)
          )
        }
      }
    } catch {}

    return {
      id: r.id,
      imageUrl: r.image_url || '',
      imageFocus: r.image_focus || 'center',
      heading: r.heading || '',
      headingItalic: r.heading_italic || '',
      subheading: r.subheading || null,
      badgeText: r.badge_text || '',
      ctaLabel: r.cta_label || 'Shop Now',
      ctaUrl: r.cta_url || '/shop',
      ctaSecondaryLabel: r.cta_secondary_label || '',
      ctaSecondaryUrl: r.cta_secondary_url || '',
      overlayStyle: r.overlay_style || 'dark',
      textColor: r.text_color || 'white',
      isActive: r.is_active,
      order: r.display_order,
      videoUrl: videoUrls[0] || null,
      videoUrls,
      slides,
    }
  })
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = createClient()
  const { data } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', userId).order('created_at', { ascending: false })
  return (data || []).map((r: any) => ({
    id: r.id, orderNumber: r.order_number, userId: r.user_id, addressSnapshot: r.address_snapshot,
    paymentMethod: r.payment_method, paymentStatus: r.payment_status,
    razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id,
    couponCode: r.coupon_code, couponDiscount: r.coupon_discount, subtotal: r.subtotal,
    shippingCharge: r.shipping_charge, totalGst: r.total_gst, totalAmount: r.total_amount,
    status: r.status, shiprocketOrderId: r.shiprocket_order_id, trackingId: r.tracking_id,
    courierName: r.courier_name, estimatedDelivery: r.estimated_delivery,
    returnReason: r.return_reason, returnImageUrl: r.return_image_url, notes: r.notes,
    createdAt: r.created_at, updatedAt: r.updated_at,
    items: (r.order_items || []).map((i: any) => ({
      id: i.id, productId: i.product_id, productName: i.product_name, productImage: i.product_image,
      colour: i.colour, quantity: i.quantity, originalPrice: i.original_price, salePrice: i.sale_price,
      gstRate: i.gst_rate, gstAmount: i.gst_amount, total: i.total
    }))
  }))
}

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const supabase = createClient()
  const { data } = await supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false })
  return (data || []).map((r: any) => ({ id: r.id, userId: r.user_id, fullName: r.full_name, phone: r.phone, addressLine1: r.address_line1, addressLine2: r.address_line2 || '', city: r.city, state: r.state, pincode: r.pincode, isDefault: r.is_default }))
}
