'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import type { Product } from '@/types'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import toast from 'react-hot-toast'

export default function ProductCard({ product, userId }: { product: Product; userId?: string }) {
  const [flipped, setFlipped] = useState(false)
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const addItem = useCartStore(s => s.addItem)
  const { toggle, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)

  const x = useMotionValue(0), y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const handleMouseLeave = () => { x.set(0); y.set(0); setFlipped(false) }

  const effectivePrice = getEffectivePrice(product)
  const isOnSale = effectivePrice < product.originalPrice
  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0]
  const firstVariant = product.variants?.[0]

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!firstVariant || firstVariant.stock === 0) return
    addItem({ productId: product.id, productName: product.name, productSlug: product.slug, productImage: primaryImage?.url || '', colour: firstVariant.colour, colourHex: firstVariant.colourHex, originalPrice: product.originalPrice, salePrice: product.salePrice, quantity: 1, stock: firstVariant.stock, gstRate: product.gstRate })
    toast.success(`${product.name} added to cart!`)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    await toggle(product.id, userId)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  return (
    <motion.div ref={cardRef} style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className="relative cursor-pointer" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      animate={{ y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}>
      <div className="bg-white border overflow-hidden relative group" style={{ borderColor: 'var(--border)', borderRadius: '2px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Image area */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--cream)' }}>
          {/* Front */}
          <motion.div className="absolute inset-0" animate={{ opacity: flipped ? 0 : 1 }} transition={{ duration: 0.3 }}>
            {primaryImage && !imgError ? (
              <Image src={primaryImage.url} alt={primaryImage.altText || product.name} fill className="object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ background: 'var(--cream)' }}>
                <div className="text-5xl">🥻</div>
                <p className="text-xs text-center px-4 font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>{product.name}</p>
              </div>
            )}
          </motion.div>

          {/* Back (flip) */}
          <motion.div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: 'linear-gradient(135deg, var(--crimson) 0%, var(--crimson-dark) 100%)' }} animate={{ opacity: flipped ? 1 : 0 }} transition={{ duration: 0.3 }}>
            <div className="text-white space-y-2">
              <p className="text-xs tracking-widest uppercase opacity-70">{product.fabric}{product.weaveType ? ` · ${product.weaveType}` : ''}</p>
              {product.originRegion && <p className="text-xs opacity-60">📍 {product.originRegion}</p>}
              <p className="text-sm font-light leading-relaxed">{product.description?.slice(0, 100)}...</p>
              <div className="flex flex-wrap gap-1 mt-2">{product.occasion?.slice(0, 3).map(o => <span key={o} className="text-xs px-2 py-0.5 border border-white/30 opacity-80">{o}</span>)}</div>
              {product.blouseIncluded && <p className="text-xs opacity-70">✓ Blouse piece included</p>}
              {product.weightGrams > 0 && <p className="text-xs opacity-70">Weight: {product.weightGrams}g</p>}
            </div>
          </motion.div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.isNew && <span className="badge-new">New</span>}
            {isOnSale && <span className="badge-sale">{product.discountPercent}% Off</span>}
            {product.isOutOfStock && <span className="badge-sold">Sold Out</span>}
            {product.isBestseller && !product.isOutOfStock && <span className="badge-bestseller">Bestseller</span>}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            <motion.button initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} className="w-8 h-8 bg-white flex items-center justify-center border transition-all" style={{ borderColor: 'var(--border)' }} onClick={handleWishlist}>
              <Heart size={14} fill={wishlisted ? 'var(--crimson)' : 'none'} stroke={wishlisted ? 'var(--crimson)' : 'currentColor'} style={{ color: wishlisted ? 'var(--crimson)' : 'var(--text-primary)' }} />
            </motion.button>
            <motion.button initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} className="w-8 h-8 bg-white flex items-center justify-center border transition-all" style={{ borderColor: 'var(--border)' }} onClick={e => { e.preventDefault(); setFlipped(!flipped) }}>
              <Eye size={14} style={{ color: 'var(--text-primary)' }} />
            </motion.button>
          </div>

          {/* Add to cart */}
          {!product.isOutOfStock && (
            <motion.button className="absolute bottom-0 left-0 right-0 py-3 text-xs font-medium tracking-widest uppercase text-white"
              style={{ background: 'var(--crimson)' }}
              initial={{ y: '100%' }} whileHover={{ background: 'var(--gold)' }}
              onClick={handleAddToCart}>
              <span className="flex items-center justify-center gap-2"><ShoppingBag size={14} /> Add to Cart</span>
            </motion.button>
          )}
        </div>

        {/* Info */}
        <Link href={`/product/${product.slug}`}>
          <div className="p-3">
            <p className="text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{product.fabric}{product.originRegion ? ` · ${product.originRegion}` : ''}</p>
            <p className="font-light leading-snug mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '15px' }}>{product.name}</p>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < Math.round(product.averageRating) ? 'var(--gold)' : 'var(--border)', fontSize: '11px' }}>★</span>)}</div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>({product.reviewCount})</span>
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-sm" style={{ color: 'var(--crimson)' }}>{formatPrice(effectivePrice)}</span>
              {isOnSale && <span className="text-xs line-through" style={{ color: 'var(--text-secondary)' }}>{formatPrice(product.originalPrice)}</span>}
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}
