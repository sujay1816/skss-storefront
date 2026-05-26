'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Eye, Zap } from 'lucide-react'
import type { Product } from '@/types'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { useCompareStore } from '@/lib/store/compare'
import toast from 'react-hot-toast'

// #12 — Custom gold SVG star
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="star-svg" width="12" height="12" viewBox="0 0 24 24" fill={filled ? 'var(--gold)' : 'none'} stroke={filled ? 'var(--gold)' : 'var(--border)'} strokeWidth="1.5">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
)

// #11 — Refined price display
const Price = ({ amount, className = '', style = {} }: { amount: number; className?: string; style?: React.CSSProperties }) => {
  const formatted = amount.toLocaleString('en-IN')
  return (
    <span className={className} style={style}>
      {/* FIX: plain ₹ inline — no superscript, no vertical-align tricks */}
      <span style={{ fontSize: '0.85em', fontFamily: 'var(--font-body)', fontWeight: 400, marginRight: 1 }}>₹</span>
      <span className="price-amount">{formatted}</span>
    </span>
  )
}

export default function ProductCard({ product, userId, index = 99 }: { product: Product; userId?: string; index?: number }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  // #1 — selected variant for swatch interaction
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  // instant tap feedback
  const [tapped, setTapped] = useState(false)

  const addItem = useCartStore(s => s.addItem)
  const { toggle, isWishlisted } = useWishlistStore()
  const { add: addToCompare, remove: removeFromCompare, has: inCompare, items: compareItems } = useCompareStore()
  const isInCompare = inCompare(product.id)
  const compareMaxed = compareItems.length >= 3 && !isInCompare
  const wishlisted = isWishlisted(product.id)

  const effectivePrice = getEffectivePrice(product)
  const isOnSale = effectivePrice < product.originalPrice
  const discountPct = isOnSale ? Math.round((1 - effectivePrice / product.originalPrice) * 100) : 0

  // Use selected variant's image if available
  const selectedVariant = product.variants?.[selectedVariantIdx] || product.variants?.[0]
  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0]
  // Use selected variant stock for accurate display — not total across all variants
  // product.isOutOfStock = ALL variants out of stock
  // selectedVariant.stock = 0 means THIS colour is out of stock
  const selectedVariantOutOfStock = !selectedVariant || selectedVariant.stock === 0
  const isLowStock = selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTapped(false)
    if (!selectedVariant) return

    // Re-check live stock from DB before adding — the product page data
    // may be stale (loaded 30+ minutes ago via ISR cache)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data: variant } = await sb
        .from('product_variants')
        .select('stock')
        .eq('id', selectedVariant.id)
        .single()

      const liveStock = variant?.stock ?? selectedVariant.stock
      if (liveStock === 0) {
        toast.error(`${product.name} (${selectedVariant.colour}) is out of stock.`, {
          className: 'toast-brand toast-error-brand'
        })
        return
      }

      addItem({
        productId: product.id, productName: product.name, productSlug: product.slug,
        productImage: primaryImage?.url || '', colour: selectedVariant.colour,
        colourHex: selectedVariant.colourHex, originalPrice: product.originalPrice,
        salePrice: product.salePrice, quantity: 1,
        stock: liveStock,  // use live stock so cart quantity cap is accurate
        gstRate: product.gstRate
      }, userId)
      toast.success(
        <span>Added to cart! <a href="/cart" style={{ color: 'var(--crimson)', fontWeight: 600, marginLeft: 4 }}>View Cart →</a></span>,
        { className: 'toast-brand toast-success-brand', icon: '🛍️', duration: 3500 }
      )
    } catch {
      // If live check fails, fall back to cached stock
      if (selectedVariant.stock === 0) {
        toast.error('This item is out of stock.', { className: 'toast-brand toast-error-brand' })
        return
      }
      addItem({
        productId: product.id, productName: product.name, productSlug: product.slug,
        productImage: primaryImage?.url || '', colour: selectedVariant.colour,
        colourHex: selectedVariant.colourHex, originalPrice: product.originalPrice,
        salePrice: product.salePrice, quantity: 1, stock: selectedVariant.stock, gstRate: product.gstRate
      }, userId)
      toast.success(
        <span>Added to cart! <a href="/cart" style={{ color: 'var(--crimson)', fontWeight: 600, marginLeft: 4 }}>View Cart →</a></span>,
        { className: 'toast-brand toast-success-brand', icon: '🛍️', duration: 3500 }
      )
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (wishlistLoading) return
    setWishlistLoading(true)
    await toggle(product.id, userId)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!', {
      className: 'toast-brand toast-success-brand',
      icon: wishlisted ? '💔' : '❤️',
    })
    setWishlistLoading(false)
  }

  // Instant tap feedback — shows spinner immediately on mobile tap
  // Auto-resets after 3s in case navigation is slow or user taps Add to Cart
  const handleProductTap = () => {
    setTapped(true)
    setTimeout(() => setTapped(false), 3000)
  }

  return (
    <div className="relative cursor-pointer product-card-wrapper">
      <Link href={`/product/${product.slug}`} onClick={handleProductTap} prefetch={false}>
        <div className="bg-white overflow-hidden relative group product-card-inner"
          style={{ border: '1px solid var(--border)', borderRadius: 4 }}>

          {/* Image area */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '2/3', background: 'var(--cream)' }}>

            {/* Instant tap overlay — shows immediately before navigation */}
            {tapped && (
              <div className="absolute inset-0 z-20 flex items-center justify-center"
                style={{ background: 'rgba(253,250,247,0.7)', backdropFilter: 'blur(2px)' }}>
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
              </div>
            )}

            {/* Main image */}
            <div className="absolute inset-0 product-card-img-wrap">
              {primaryImage && !imgError ? (
                <>
                  {/* Loading skeleton shown until image loads */}
                  {!imgLoaded && <div className="absolute inset-0 skeleton" />}
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.altText || product.name}
                    fill
                    className="object-cover object-top"
                    onError={() => setImgError(true)}
                    onLoad={() => setImgLoaded(true)}
                    style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority={index < 4}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                  style={{ background: 'linear-gradient(135deg, var(--cream) 0%, var(--cream-dark) 100%)' }}>
                  <div className="text-5xl">🥻</div>
                  <p className="text-xs text-center px-4 font-medium"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                    {product.name}
                  </p>
                </div>
              )}
            </div>

            {/* Dark gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none product-card-gradient" />

            {/* Badges — max 2 shown, priority order to avoid clutter on mobile */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {selectedVariantOutOfStock
                ? <span className="badge-sold">{product.isOutOfStock ? 'Sold Out' : 'Out of Stock'}</span>
                : isLowStock
                  ? <span className="flex items-center gap-1 text-white"
                      style={{ background: '#F59E0B', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', padding: '3px 8px', textTransform: 'uppercase' }}>
                      <Zap size={8} /> Only {selectedVariant?.stock} left
                    </span>
                  : null
              }
              {!selectedVariantOutOfStock && isOnSale && (
                <span className="badge-sale">{discountPct}% Off</span>
              )}
              {!selectedVariantOutOfStock && !isOnSale && product.isNew && (
                <span className="badge-new">New</span>
              )}
              {!selectedVariantOutOfStock && !isOnSale && product.isBestseller && (
                <span className="badge-bestseller">Bestseller</span>
              )}
            </div>

            {/* Wishlist + Quick view */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
              <button
                type="button"
                className="w-9 h-9 md:w-8 md:h-8 bg-white flex items-center justify-center shadow-sm transition-all md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                style={{ border: '1px solid var(--border)', opacity: wishlistLoading ? 0.5 : 1, cursor: wishlistLoading ? 'not-allowed' : 'pointer' }}
                onClick={handleWishlist}
                onMouseEnter={e => !wishlistLoading && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}>
                <Heart size={14}
                  fill={wishlisted ? 'var(--crimson)' : 'none'}
                  stroke={wishlisted ? 'var(--crimson)' : 'currentColor'}
                  style={{ color: wishlisted ? 'var(--crimson)' : 'var(--text-primary)' }} />
              </button>
              {/* Compare toggle */}
              <button
                type="button"
                aria-label={isInCompare ? 'Remove from comparison' : compareMaxed ? 'Max 3 products' : 'Add to comparison'}
                title={isInCompare ? 'Remove from comparison' : compareMaxed ? 'Max 3 products for comparison' : 'Compare'}
                disabled={compareMaxed}
                className="w-9 h-9 md:w-8 md:h-8 bg-white flex items-center justify-center shadow-sm transition-all md:opacity-0 md:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                style={{ border: `1px solid ${isInCompare ? 'var(--crimson)' : 'var(--border)'}`, opacity: compareMaxed ? 0.4 : 1, cursor: compareMaxed ? 'not-allowed' : 'pointer' }}
                onClick={e => { e.preventDefault(); e.stopPropagation(); isInCompare ? removeFromCompare(product.id) : addToCompare(product) }}
                onMouseEnter={e => !compareMaxed && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = isInCompare ? 'var(--crimson)' : 'var(--border)')}>
                <Eye size={13} style={{ color: isInCompare ? 'var(--crimson)' : 'var(--text-primary)' }} />
              </button>
            </div>

            {/* Add to Cart:
                Desktop — slides up from bottom on hover (full bar)
                Mobile — compact button below the image (not overlaying it) */}
            {!selectedVariantOutOfStock && (
              <button
                type="button"
                className="absolute bottom-0 left-0 right-0 py-2.5 text-xs font-medium tracking-widest uppercase text-white items-center justify-center gap-2 transition-all duration-300 hidden md:flex md:translate-y-full md:group-hover:translate-y-0"
                style={{ background: 'var(--crimson)', zIndex: 10 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--crimson)')}
                onClick={handleAddToCart}>
                <ShoppingBag size={13} /> Add to Cart
              </button>
            )}
          </div>

          {/* Product info */}
          <div className="p-3 pb-2">
            <p className="text-xs tracking-widest uppercase mb-1 product-card-fabric"
              style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
              {product.fabric}{product.originRegion ? ` · ${product.originRegion}` : ''}
            </p>
            <p className="font-light leading-snug mb-2 transition-colors product-card-name" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}>
              {product.name}
            </p>

            {/* Colour swatches — Myntra/Ajio style */}
            {product.variants && product.variants.length > 1 &&
             !(product.variants.length === 1 && product.variants[0].colour === 'Single Piece') && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap" onClick={e => e.preventDefault()}>
                {product.variants.slice(0, 5).map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-label={`Select colour: ${v.colour}`}
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setSelectedVariantIdx(i) }}
                    style={{
                      width: 13, height: 13, borderRadius: '50%', flexShrink: 0, padding: 0,
                      background: v.colourHex || '#bbb',
                      border: selectedVariantIdx === i
                        ? '2px solid var(--crimson)' : '1.5px solid rgba(0,0,0,0.15)',
                      opacity: v.stock === 0 ? 0.3 : 1,
                      cursor: 'pointer', outline: 'none',
                      boxShadow: selectedVariantIdx === i ? '0 0 0 1px white inset' : 'none',
                    }}
                  />
                ))}
                {product.variants.length > 5 && (
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>+{product.variants.length - 5}</span>
                )}
              </div>
            )}

            {/* #12 — Gold SVG stars */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} filled={i < Math.round(product.averageRating)} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* #11 — Price + mobile Add to Cart in same row */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <Price
                  amount={effectivePrice}
                  className="font-semibold"
                  style={{ color: 'var(--crimson)', fontSize: '15px' }}
                />
                {isOnSale && (
                  <>
                    <Price
                      amount={product.originalPrice}
                      className="line-through"
                      style={{ color: 'var(--text-secondary)', fontSize: '11px' }}
                    />
                    <span style={{ color: '#16A34A', fontSize: '10px', fontWeight: 600 }}>
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>
              {/* Mobile-only Add to Cart icon button */}
              {!selectedVariantOutOfStock && (
                <button
                  className="md:hidden flex-shrink-0 flex items-center justify-center rounded"
                  style={{ width: 32, height: 32, background: 'var(--crimson)', color: 'white', border: 'none' }}
                  onClick={handleAddToCart}
                  aria-label="Add to cart">
                  <ShoppingBag size={14} />
                </button>
              )}
            </div>
          </div>


        </div>
      </Link>
    </div>
  )
}
