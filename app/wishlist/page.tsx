'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWishlistStore } from '@/lib/store/wishlist'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/types'
import { useRouter } from 'next/navigation'

export default function WishlistPage() {
  const router = useRouter()
  const { ids } = useWishlistStore()
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/wishlist'); return }
      setUser(user)
      if (ids.length === 0) { setLoading(false); return }
      const { data } = await supabase.from('products').select('*, categories(slug,name), product_images(id,url,public_id,alt_text,is_primary,order_index), product_variants(id,colour,colour_hex,stock,sku)').in('id', ids).eq('is_active', true)
      if (data) setProducts(data.map((r: any) => {
        const variants = r.product_variants || []
        const totalStock = variants.reduce((s: number, v: any) => s + v.stock, 0)
        return { id: r.id, name: r.name, slug: r.slug, description: r.description, fabric: r.fabric, weaveType: r.weave_type, originRegion: r.origin_region, occasion: r.occasion || [], careInstructions: r.care_instructions, blouseIncluded: r.blouse_included, length: r.length, weightGrams: r.weight_grams, category: r.categories?.slug, categorySlug: r.categories?.slug, categoryName: r.categories?.name, originalPrice: r.original_price, salePrice: r.sale_price, discountPercent: r.discount_percent, saleStartDate: r.sale_start_date, saleEndDate: r.sale_end_date, gstRate: r.gst_rate, images: (r.product_images || []).map((i: any) => ({ id: i.id, url: i.url, publicId: i.public_id, altText: i.alt_text, isPrimary: i.is_primary, order: i.order_index })), variants: variants.map((v: any) => ({ id: v.id, colour: v.colour, colourHex: v.colour_hex, stock: v.stock, sku: v.sku })), totalStock, isOutOfStock: totalStock === 0, isNew: new Date(r.created_at) > new Date(Date.now() - 30 * 86400000), isFeatured: r.is_featured, isBestseller: r.is_bestseller, customFields: r.custom_fields || {}, averageRating: r.average_rating || 0, reviewCount: r.review_count || 0, createdAt: r.created_at, updatedAt: r.updated_at, videoUrl: r.video_url || null }
      }))
      setLoading(false)
    }
    load()
  }, [ids])

  if (loading) return (
    <div className="page-container py-8 animate-fadeIn">
      <h1 className="section-heading mb-8">My Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white overflow-hidden" style={{ border: '1px solid var(--border)', borderRadius: 4 }}>
            <div className="skeleton" style={{ aspectRatio: '3/4' }} />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-4 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="page-container py-8 animate-fadeIn">
      <h1 className="section-heading mb-8">My Wishlist</h1>
      {ids.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Heart size={36} style={{ color: 'var(--crimson)' }} />
          </div>
          <h2 className="text-2xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Your wishlist is empty</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Save the sarees you love and come back to them anytime.</p>
          <Link href="/shop" className="btn-primary inline-flex">Browse Collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map(p => <ProductCard key={p.id} product={p} userId={user?.id} />)}</div>
      )}
    </div>
  )
}
