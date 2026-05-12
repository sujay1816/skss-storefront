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
      <span className="price-rupee">₹</span>
      <span className="price-amount">{formatted}</span>
    </span>
  )
}

export default function ProductCard({ product, userId }: { product: Product; userId?: string }) {
  const [imgError, setImgError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  // #1 — selected variant for swatch interaction
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  // instant tap feedback
  const [tapped, setTapped] = useState(false)

  const addItem = useCartStore(s => s.addItem)
  const { toggle, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)

  const effectivePrice = getEffectivePrice(product)
  const isOnSale = effectivePrice < product.originalPrice
  const discountPct = isOnSale ? Math.round((1 - effectivePrice / product.originalPrice) * 100) : 0

  // Use selected variant's image if available
  const selectedVariant = product.variants?.[selectedVariantIdx] || product.variants?.[0]
  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0]
  const isLowStock = selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!selectedVariant || selectedVariant.stock === 0) return
    addItem({
      productId: product.id, productName: product.name, productSlug: product.slug,
      productImage: primaryImage?.url || '', colour: selectedVariant.colour,
      colourHex: selectedVariant.colourHex, originalPrice: product.originalPrice,
      salePrice: product.salePrice, quantity: 1, stock: selectedVariant.stock, gstRate: product.gstRate
    })
    toast.success(`Added to cart!`, {
      className: 'toast-brand toast-success-brand',
      icon: '🛍️',
    })
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
  const handleProductTap = () => {
    setTapped(true)
  }

  return (
    <motion.div
      className="relative cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
    >
      <Link href={`/product/${product.slug}`} onClick={handleProductTap} prefetch={true}>
        <div className="bg-white overflow-hidden relative group transition-shadow duration-300"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 4,
            boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.3s ease'
          }}>

          {/* Image area */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--cream)' }}>

            {/* Instant tap overlay — shows immediately before navigation */}
            {tapped && (
              <div className="absolute inset-0 z-20 flex items-center justify-center"
                style={{ background: 'rgba(253,250,247,0.7)', backdropFilter: 'blur(2px)' }}>
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
              </div>
            )}

            {/* Main image */}
            <motion.div className="absolute inset-0"
              animate={{ scale: isHovered ? 1.06 : 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}>
              {primaryImage && !imgError ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText || product.name}
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                  // #6 — priority on first 4 items for LCP
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
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
            </motion.div>

            {/* Dark gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }} />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {product.isNew && <span className="badge-new">New</span>}
              {isOnSale && <span className="badge-sale">{discountPct}% Off</span>}
              {product.isOutOfStock && <span className="badge-sold">Sold Out</span>}
              {product.isBestseller && !product.isOutOfStock && <span className="badge-bestseller">Bestseller</span>}
              {isLowStock && !product.isOutOfStock && (
                <span className="flex items-center gap-1 text-white"
                  style={{ background: '#F59E0B', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', padding: '3px 8px', textTransform: 'uppercase' }}>
                  <Zap size={8} /> Only {selectedVariant.stock} left
                </span>
              )}
            </div>

            {/* Wishlist + Quick view */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
              <button
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
            </div>

            {/* Add to Cart — always visible on mobile, hover-reveal on desktop */}
            {!product.isOutOfStock && (
              <button
                className="absolute bottom-0 left-0 right-0 py-3 text-xs font-medium tracking-widest uppercase text-white flex items-center justify-center gap-2 transition-all duration-300 md:translate-y-full md:group-hover:translate-y-0"
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
            <p className="text-xs tracking-widest uppercase mb-1"
              style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
              {product.fabric}{product.originRegion ? ` · ${product.originRegion}` : ''}
            </p>
            <p className="font-light leading-snug mb-2 transition-colors"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '15px' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}>
              {product.name}
            </p>

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

            {/* #11 — Refined price */}
            <div className="flex items-baseline gap-2">
              <Price
                amount={effectivePrice}
                className="font-semibold"
                style={{ color: 'var(--crimson)', fontSize: '15px' }}
              />
              {isOnSale && (
                <>
                  <Price
                    amount={product.originalPrice}
                    className="line-through text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* #1 — Colour swatch strip */}
          {product.variants && product.variants.length > 0 && (
            <div className="colour-swatch-strip" onClick={e => e.preventDefault()}>
              {product.variants.slice(0, 6).map((v, i) => (
                <div
                  key={v.id}
                  className={`colour-swatch ${selectedVariantIdx === i ? 'active' : ''} ${v.stock === 0 ? 'out-of-stock' : ''}`}
                  style={{ background: v.colourHex || '#888' }}
                  title={v.colour}
                  onClick={e => { e.preventDefault(); if (v.stock > 0) setSelectedVariantIdx(i) }}
                />
              ))}
              {product.variants.length > 6 && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)', fontSize: '10px', alignSelf: 'center' }}>
                  +{product.variants.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
