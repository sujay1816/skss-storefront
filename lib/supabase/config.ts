import { createClient } from './server'
import { cache } from 'react'
import type { SiteConfig, Category, Product, ProductImage, ProductVariant, Banner, Review, Order, Address } from '@/types'

// ─── Mappers ────────────────────────────────────────────────────────────────
function mapImage(r: any): ProductImage {
  return { id: r.id, url: r.url, publicId: r.public_id || '', altText: r.alt_text || '', isPrimary: r.is_primary, order: r.order_index }
}
function mapVariant(r: any): ProductVariant {
  return { id: r.id, colour: r.colour, colourHex: r.colour_hex, stock: r.stock, sku: r.sku || '' }
}
function mapProduct(r: any): Product {
  const variants = (r.product_variants || []).map(mapVariant)
  const images = (r.product_images || []).sort((a: any, b: any) => a.order_index - b.order_index).map(mapImage)
  const totalStock = variants.reduce((s: number, v: ProductVariant) => s + v.stock, 0)
  const isNew = new Date(r.created_at) > new Date(Date.now() - 30 * 86400000)
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

// ─── Select strings ──────────────────────────────────────────────────────────
// List view — only primary image, only needed columns (no description, care instructions etc)
const PRODUCT_SELECT_LIST = `
  id, name, slug, fabric, weave_type, origin_region, occasion,
  original_price, sale_price, discount_percent, sale_start_date, sale_end_date,
  gst_rate, is_featured, is_bestseller, average_rating, review_count,
  created_at, updated_at, video_url,
  categories(slug, name),
  product_images(id, url, alt_text, is_primary, order_index),
  product_variants(id, colour, colour_hex, stock, sale_price)
`
// Detail view — all columns + all images
const PRODUCT_SELECT_FULL = `
  *, categories(slug, name),
  product_images(id, url, public_id, alt_text, is_primary, order_index),
  product_variants(id, colour, colour_hex, stock, sku, sale_price)
`

// ─── Cached public fetchers (work with ISR) ──────────────────────────────────
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const sb = createClient()
  const { data } = await sb.from('site_config').select('key, value')
  const config: SiteConfig = {} as SiteConfig
  if (data) data.forEach((row: any) => { config[row.key] = row.value })
  return config
})

export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = createClient()
  const { data } = await sb.from('categories').select('id, name, slug, description, image_url, is_active, display_order')
    .eq('is_active', true).order('display_order')
  return (data || []).map((r: any) => ({
    id: r.id, name: r.name, slug: r.slug, description: r.description || '',
    imageUrl: r.image_url || '', isActive: r.is_active, displayOrder: r.display_order
  }))
})

// ─── Product filters ─────────────────────────────────────────────────────────
export interface ProductFilters {
  categorySlug?: string
  category?: string
  search?: string
  featured?: boolean
  bestseller?: boolean
  newArrivals?: boolean
  fabrics?: string[]
  occasions?: string[]
  priceMin?: number
  priceMax?: number
  onlyInStock?: boolean
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount'
  limit?: number
  offset?: number
  withCount?: boolean   // only true when paginating (shop page), skip on homepage
}

export async function getProducts(filters?: ProductFilters): Promise<{ products: Product[]; total: number }> {
  const sb = createClient()
  const withCount = filters?.withCount ?? false

  let q = sb
    .from('products')
    .select(PRODUCT_SELECT_LIST, withCount ? { count: 'exact' } : undefined)
    .eq('is_active', true)

  // Category — get id first (cached), then filter
  const categorySlug = filters?.categorySlug || filters?.category
  if (categorySlug) {
    const catId = await getCategoryId(categorySlug)
    if (catId) q = q.eq('category_id', catId)
    else return { products: [], total: 0 }
  }

  if (filters?.featured)    q = q.eq('is_featured', true)
  if (filters?.bestseller)  q = q.eq('is_bestseller', true)
  if (filters?.newArrivals) {
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
    q = q.gte('created_at', cutoff)
  }
  if (filters?.search) {
    const s = `%${filters.search}%`
    q = q.or(`name.ilike.${s},fabric.ilike.${s},origin_region.ilike.${s}`)
  }
  if (filters?.fabrics?.length)   q = q.in('fabric', filters.fabrics)
  if (filters?.occasions?.length) q = q.overlaps('occasion', filters.occasions)
  if (filters?.priceMin !== undefined) {
    q = q.or(`sale_price.gte.${filters.priceMin},and(sale_price.is.null,original_price.gte.${filters.priceMin})`)
  }
  if (filters?.priceMax !== undefined) {
    q = q.or(`sale_price.lte.${filters.priceMax},and(sale_price.is.null,original_price.lte.${filters.priceMax})`)
  }

  switch (filters?.sortBy) {
    case 'price_asc':  q = q.order('original_price', { ascending: true });  break
    case 'price_desc': q = q.order('original_price', { ascending: false }); break
    case 'rating':     q = q.order('average_rating', { ascending: false });  break
    case 'discount':   q = q.order('discount_percent', { ascending: false, nullsFirst: false }); break
    default:           q = q.order('created_at', { ascending: false }); break
  }

  const limit  = filters?.limit  ?? 16
  const offset = filters?.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) { console.error('getProducts:', error.message); return { products: [], total: 0 } }

  // Filter to primary image only in JS (Supabase doesn't support WHERE on nested select)
  const products = (data || []).map((r: any) => {
    const imgs = (r.product_images || [])
    const primary = imgs.find((i: any) => i.is_primary) || imgs[0] || null
    return mapProduct({ ...r, product_images: primary ? [primary] : [] })
  })

  return { products, total: count ?? products.length }
}

// Cached category id lookup — avoids repeat queries for same slug
const getCategoryId = cache(async (slug: string): Promise<string | null> => {
  const sb = createClient()
  const { data } = await sb.from('categories').select('id').eq('slug', slug).single()
  return data?.id ?? null
})

// Homepage sections — no count query, no pagination overhead
export async function getProductsSimple(filters?: {
  categorySlug?: string; category?: string; featured?: boolean
  bestseller?: boolean; newArrivals?: boolean; limit?: number
}): Promise<Product[]> {
  const result = await getProducts({ ...filters, limit: filters?.limit ?? 8, withCount: false })
  return result.products
}

// ─── Product detail (uses cookie client for auth-aware RLS) ─────────────────
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = createClient()
  const { data, error } = await sb.from('products')
    .select(PRODUCT_SELECT_FULL)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return mapProduct(data)
}

export async function getRelatedProducts(categorySlug: string, excludeSlug: string): Promise<Product[]> {
  const catId = await getCategoryId(categorySlug)
  if (!catId) return []
  const sb = createClient()
  const { data } = await sb.from('products')
    .select(PRODUCT_SELECT_LIST)
    .eq('category_id', catId)
    .eq('is_active', true)
    .neq('slug', excludeSlug)
    .limit(4)
  return (data || []).map((r: any) => {
    const imgs = (r.product_images || [])
    const primary = imgs.find((i: any) => i.is_primary) || imgs[0] || null
    return mapProduct({ ...r, product_images: primary ? [primary] : [] })
  })
}

// ─── Auth-required queries (use cookie client) ───────────────────────────────
export async function getProductReviews(productId: string): Promise<Review[]> {
  const sb = createClient()
  const { data } = await sb.from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
  return (data || []).map((r: any) => ({
    id: r.id, productId, userId: r.user_id,
    userFullName: r.profiles?.full_name || 'Anonymous',
    userAvatarUrl: r.profiles?.avatar_url || null,
    rating: r.rating, comment: r.comment || '',
    isVerifiedPurchase: r.is_verified_purchase, createdAt: r.created_at
  }))
}

export async function getBanners(): Promise<Banner[]> {
  const sb = createClient()
  const { data } = await sb.from('banners').select('*').eq('is_active', true).order('display_order')
  return (data || []).map((r: any) => ({
    id: r.id, imageUrl: r.image_url, imageFocus: r.image_focus || 'center',
    heading: r.heading || '', headingItalic: r.heading_italic || '',
    subheading: r.subheading || null, badgeText: r.badge_text || '',
    ctaLabel: r.cta_label, ctaUrl: r.cta_url,
    ctaSecondaryLabel: r.cta_secondary_label || '', ctaSecondaryUrl: r.cta_secondary_url || '',
    overlayStyle: r.overlay_style || 'dark', textColor: r.text_color || 'white',
    isActive: r.is_active, order: r.display_order, videoUrl: r.video_url || null
  }))
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const sb = createClient()
  const { data } = await sb.from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
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
  const sb = createClient()
  const { data } = await sb.from('addresses').select('*')
    .eq('user_id', userId).order('is_default', { ascending: false })
  return (data || []).map((r: any) => ({
    id: r.id, userId: r.user_id, fullName: r.full_name, phone: r.phone,
    addressLine1: r.address_line1, addressLine2: r.address_line2 || '',
    city: r.city, state: r.state, pincode: r.pincode, isDefault: r.is_default
  }))
}
