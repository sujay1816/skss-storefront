'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Eye, Zap } from 'lucide-react'
import type { Product } from '@/types'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import toast from 'react-hot-toast'

export default function ProductCard({ product, userId }: { product: Product; userId?: string }) {
  const [flipped, setFlipped] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const addItem = useCartStore(s => s.addItem)
  const { toggle, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)

  const effectivePrice = getEffectivePrice(product)
  const isOnSale = effectivePrice < product.originalPrice
  const discountPct = isOnSale ? Math.round((1 - effectivePrice / product.originalPrice) * 100) : 0
  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0]
  const firstVariant = product.variants?.[0]
  const isLowStock = firstVariant && firstVariant.stock > 0 && firstVariant.stock <= 3

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!firstVariant || firstVariant.stock === 0) return
    addItem({
      productId: product.id, productName: product.name, productSlug: product.slug,
      productImage: primaryImage?.url || '', colour: firstVariant.colour,
      colourHex: firstVariant.colourHex, originalPrice: product.originalPrice,
      salePrice: product.salePrice, quantity: 1, stock: firstVariant.stock, gstRate: product.gstRate
    })
    toast.success(`${product.name} added to cart!`)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (wishlistLoading) return
    setWishlistLoading(true)
    await toggle(product.id, userId)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!')
    setWishlistLoading(false)
  }
  return (
    <motion.div
      className="relative cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
    >
      <div className="bg-white overflow-hidden relative group transition-shadow duration-300"
        style={{ border: '1px solid var(--border)', borderRadius: 4, boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.3s ease' }}>

        {/* Image area */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--cream)' }}>

          {/* Main image */}
          <motion.div className="absolute inset-0" animate={{ scale: isHovered ? 1.06 : 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            {primaryImage && !imgError ? (
              <Image src={primaryImage.url} alt={primaryImage.altText || product.name} fill className="object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)' }}>
                <div className="text-5xl">🥻</div>
                <p className="text-xs text-center px-4 font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>{product.name}</p>
              </div>
            )}
          </motion.div>

          {/* Flip detail overlay */}
          <motion.div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(26,8,6,0.92) 0%, rgba(139,26,43,0.88) 100%)' }}
            animate={{ opacity: flipped ? 1 : 0 }} transition={{ duration: 0.25 }}>
            <div className="text-white space-y-2">
              <p className="text-xs tracking-widest uppercase opacity-70">{product.fabric}{product.weaveType ? ` · ${product.weaveType}` : ''}</p>
              {product.originRegion && <p className="text-xs opacity-60">📍 {product.originRegion}</p>}
              <p className="text-sm font-light leading-relaxed opacity-90">{product.description?.slice(0, 90)}...</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {product.occasion?.slice(0, 3).map(o => <span key={o} className="text-xs px-2 py-0.5 border border-white/30 opacity-80">{o}</span>)}
              </div>
              {product.blouseIncluded && <p className="text-xs opacity-70 mt-1">✓ Blouse piece included</p>}
            </div>
          </motion.div>

          {/* Dark gradient at bottom for CTA */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }} />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.isNew && <span className="badge-new">New</span>}
            {isOnSale && <span className="badge-sale">{discountPct}% Off</span>}
            {product.isOutOfStock && <span className="badge-sold">Sold Out</span>}
            {product.isBestseller && !product.isOutOfStock && <span className="badge-bestseller">Bestseller</span>}
            {isLowStock && !product.isOutOfStock && (
              <span className="flex items-center gap-1 text-white" style={{ background: '#F59E0B', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', padding: '3px 8px', textTransform: 'uppercase' }}>
                <Zap size={8} /> Only {firstVariant.stock} left
              </span>
            )}
          </div>

          {/* Wishlist + Quick view buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            <motion.button
              className="w-9 h-9 md:w-8 md:h-8 bg-white flex items-center justify-center shadow-sm transition-all md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              style={{ border: '1px solid var(--border)', opacity: wishlistLoading ? 0.5 : 1, cursor: wishlistLoading ? 'not-allowed' : 'pointer' }}
              onClick={handleWishlist}
              onMouseEnter={e => !wishlistLoading && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}>
              <Heart size={14} fill={wishlisted ? 'var(--crimson)' : 'none'} stroke={wishlisted ? 'var(--crimson)' : 'currentColor'} style={{ color: wishlisted ? 'var(--crimson)' : 'var(--text-primary)' }} />
            </motion.button>
            <motion.button
              className="w-9 h-9 md:w-8 md:h-8 bg-white flex items-center justify-center shadow-sm transition-all md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              style={{ border: '1px solid var(--border)' }}
              onClick={e => { e.preventDefault(); setFlipped(!flipped) }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}>
              <Eye size={14} style={{ color: 'var(--text-primary)' }} />
            </motion.button>
          </div>

          {/* Add to cart button */}
          {!product.isOutOfStock && (
            <motion.button
              className="absolute bottom-0 left-0 right-0 py-3 text-xs font-medium tracking-widest uppercase text-white flex items-center justify-center gap-2"
              style={{ background: 'var(--crimson)', zIndex: 10 }}
              initial={{ y: '100%' }} animate={{ y: '0%' }} whileInView={{ y: '100%' }}
              whileHover={{ background: 'var(--gold)' }}
              onClick={handleAddToCart}>
              <ShoppingBag size={13} /> Add to Cart
            </motion.button>
          )}
        </div>

        {/* Product info */}
        <Link href={`/product/${product.slug}`}>
          <div className="p-3 pb-4">
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
              {product.fabric}{product.originRegion ? ` · ${product.originRegion}` : ''}
            </p>
            <p className="font-light leading-snug mb-2 transition-colors" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '15px' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}>
              {product.name}
            </p>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < Math.round(product.averageRating) ? 'var(--gold)' : 'var(--border)', fontSize: '11px' }}>★</span>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>({product.reviewCount})</span>
              </div>
            )}
            {/* Pricing — show sale price prominently with strikethrough */}
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-base" style={{ color: 'var(--crimson)' }}>{formatPrice(effectivePrice)}</span>
              {isOnSale && (
                <>
                  <span className="text-xs line-through" style={{ color: 'var(--text-secondary)' }}>{formatPrice(product.originalPrice)}</span>
                  <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>Save {discountPct}%</span>
                </>
              )}
            </div>
            {/* Colour dots */}
            {product.variants && product.variants.length > 1 && (
              <div className="flex items-center gap-1 mt-2">
                {product.variants.slice(0, 5).map(v => (
                  <div key={v.id} className="w-3 h-3 rounded-full border" style={{ background: v.colourHex || '#888', borderColor: 'var(--border)' }} title={v.colour} />
                ))}
                {product.variants.length > 5 && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>+{product.variants.length - 5}</span>}
              </div>
            )}
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
