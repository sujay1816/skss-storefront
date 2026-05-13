'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, Star, ChevronDown, ChevronUp, MapPin, RotateCcw, Shield, Truck, Share2, Check } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductVariant, Review, SiteConfig } from '@/types'
import toast from 'react-hot-toast'

export default function ProductDetailClient({ product, reviews, relatedProducts, config, userId }: {
  product: Product; reviews: Review[]; relatedProducts: Product[]; config: SiteConfig; userId?: string
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0])
  const [activeImage, setActiveImage] = useState(0)
  const [pincode, setPincode] = useState('')
  const [pincodeResult, setPincodeResult] = useState<null | { available: boolean; message: string }>(null)
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>('details')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [qty, setQty] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [showStickyBar, setShowStickyBar] = useState(false)
  // FIX #9: track whether user has a verified purchase of this product
  const [hasVerifiedPurchase, setHasVerifiedPurchase] = useState(false)
  const [purchaseCheckDone, setPurchaseCheckDone] = useState(false)

  const addItem = useCartStore(s => s.addItem)
  const { toggle, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // FIX #9: check if logged-in user has purchased this product
  useEffect(() => {
    if (!userId) { setPurchaseCheckDone(true); return }
    const checkPurchase = async () => {
      const supabase = createClient()
      // Step 1: get this user's order IDs
      const { data: userOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['delivered', 'shipped', 'confirmed'])
      const orderIds = (userOrders || []).map((o: any) => o.id)
      if (orderIds.length === 0) {
        setHasVerifiedPurchase(false)
        setPurchaseCheckDone(true)
        return
      }
      // Step 2: check if any order_item for this product exists in those orders
      const { count } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', product.id)
        .in('order_id', orderIds)
      setHasVerifiedPurchase((count || 0) > 0)
      setPurchaseCheckDone(true)
    }
    checkPurchase()
  }, [userId, product.id])

  const effectivePrice = getEffectivePrice(product)
  const isOnSale = effectivePrice < product.originalPrice
  const gstAmount = Math.round((effectivePrice * product.gstRate) / 100)
  const primaryImage = product.images?.[activeImage] || product.images?.[0]

  const checkPincode = async () => {
    if (pincode.length !== 6) return
    setCheckingPincode(true)
    try {
      // FIX #2: corrected path from /api/shiprocket/pincode to /api/shiprocket
      const res = await fetch(`/api/shiprocket?pincode=${pincode}`)
      const data = await res.json()
      setPincodeResult(data)
    } catch {
      const eta = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      setPincodeResult({ available: true, message: `Estimated delivery by ${eta}` })
    }
    setCheckingPincode(false)
  }

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock === 0) return
    addItem({ productId: product.id, productName: product.name, productSlug: product.slug, productImage: primaryImage?.url || '', colour: selectedVariant.colour, colourHex: selectedVariant.colourHex, originalPrice: product.originalPrice, salePrice: product.salePrice, quantity: qty, stock: selectedVariant.stock, gstRate: product.gstRate })
    setAddedToCart(true)
    toast.success(`${product.name} added to cart!`)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  const handleWishlist = async () => {
    await toggle(product.id, userId)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  const submitReview = async () => {
    if (!userId) { toast.error('Please sign in to leave a review'); return }
    if (!reviewText.trim()) return
    setReviewSubmitting(true)
    const supabase = createClient()
    // FIX #9: pass is_verified_purchase based on actual purchase history
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: userId,
      rating: reviewRating,
      comment: reviewText,
      is_approved: false,
      is_verified_purchase: hasVerifiedPurchase,
    })
    if (error) { toast.error('Could not submit review. You may have already reviewed this product.'); setReviewSubmitting(false); return }
    setReviewSubmitted(true)
    toast.success('Review submitted! Thank you.')
    setReviewSubmitting(false)
  }

  const Accordion = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
      <button className="w-full flex items-center justify-between py-4" onClick={() => setOpenSection(openSection === id ? null : id)}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        {openSection === id ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
      </button>
      <AnimatePresence>
        {openSection === id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className="page-container py-8 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6 flex-wrap" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/" className="hover:underline" style={{ color: 'var(--crimson)' }}>Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:underline">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:underline capitalize">{product.categoryName}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Images + Video */}
        <div className="lg:w-1/2">
          {lightboxOpen && (
            <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
              <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
              {product.images.length > 1 && (
                <>
                  <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.max(0, i-1)) }}>‹</button>
                  <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.min(product.images.length-1, i+1)) }}>›</button>
                </>
              )}
              {product.images[lightboxIdx]?.url && (
                <img src={product.images[lightboxIdx].url} alt={product.name} className="lightbox-img" />
              )}
            </div>
          )}
          <motion.div
            className="relative w-full overflow-hidden mb-3 cursor-zoom-in"
            style={{ aspectRatio: '3/4', background: 'var(--cream)' }}
            onClick={() => { if (activeImage !== -1) { setLightboxIdx(activeImage); setLightboxOpen(true) } }}
            whileHover={{ scale: activeImage === -1 ? 1 : 1.02 }} transition={{ duration: 0.3 }}>
            {activeImage === -1 && product.videoUrl ? (
              <video className="w-full h-full" style={{ objectFit: 'cover' }} controls playsInline preload="metadata">
                <source src={product.videoUrl} type="video/mp4" />
              </video>
            ) : primaryImage?.url ? (
              <Image src={primaryImage.url} alt={primaryImage.altText || product.name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'var(--cream)' }}>
                <span className="text-6xl">🥻</span>
                <p className="text-sm mt-4 text-center px-8" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>{product.name}</p>
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.isNew && <span className="badge-new">New</span>}
              {isOnSale && <span className="badge-sale">{product.discountPercent}% Off</span>}
            </div>
          </motion.div>

          {(product.images.length > 1 || product.videoUrl) && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)}
                  className="relative flex-1 border-2 overflow-hidden transition-all"
                  style={{ aspectRatio: '1', borderRadius: 2, borderColor: activeImage === i ? 'var(--crimson)' : 'var(--border)', background: 'var(--cream)' }}>
                  {img.url ? <Image src={img.url} alt={img.altText} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🥻</div>}
                </button>
              ))}
              {product.videoUrl && (
                <button onClick={() => setActiveImage(-1)}
                  className="relative flex-1 border-2 overflow-hidden transition-all flex items-center justify-center"
                  style={{ aspectRatio: '1', borderRadius: 2, borderColor: activeImage === -1 ? 'var(--crimson)' : 'var(--border)', background: '#1A0E0A' }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><path d="M1 1l10 6-10 6V1z"/></svg>
                    </div>
                    <span className="text-white text-xs" style={{ fontSize: 9 }}>VIDEO</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:w-1/2">
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>{product.fabric}{product.weaveType ? ` · ${product.weaveType}` : ''}{product.originRegion ? ` · ${product.originRegion}` : ''}</p>
            <button onClick={handleShare} className="p-1.5" style={{ color: 'var(--text-secondary)' }}><Share2 size={16} /></button>
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.averageRating) ? 'var(--gold)' : 'none'} stroke="var(--gold)" />)}</div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.averageRating} ({product.reviewCount} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)' }}>{formatPrice(effectivePrice)}</span>
            {isOnSale && <><span className="text-lg line-through" style={{ color: 'var(--text-secondary)' }}>{formatPrice(product.originalPrice)}</span><span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{product.discountPercent}% off</span></>}
          </div>
          <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>Inclusive of GST ({product.gstRate}% = {formatPrice(gstAmount)})</p>

          {product.variants.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: 'var(--text-primary)' }}>Colour: <span style={{ color: 'var(--crimson)' }}>{selectedVariant?.colour}</span></p>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => v.stock > 0 && setSelectedVariant(v)} disabled={v.stock === 0} title={v.colour}
                    className="relative w-9 h-9 rounded-full border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: v.colourHex, borderColor: selectedVariant?.id === v.id ? 'var(--text-primary)' : 'transparent', boxShadow: selectedVariant?.id === v.id ? '0 0 0 2px var(--text-primary)' : 'none' }}>
                    {v.stock === 0 && <span className="absolute inset-0 flex items-center justify-center"><div className="w-full h-px bg-white/70 rotate-45" /></span>}
                    {selectedVariant?.id === v.id && v.stock > 0 && <Check size={12} className="absolute inset-0 m-auto text-white" />}
                  </button>
                ))}
              </div>
              {selectedVariant?.stock > 0 && selectedVariant?.stock <= 5 && <p className="text-xs mt-2" style={{ color: 'var(--crimson)' }}>Only {selectedVariant.stock} left!</p>}
              {selectedVariant?.stock === 0 && <p className="text-xs mt-2" style={{ color: 'var(--crimson)' }}>This colour is out of stock</p>}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Quantity</p>
            <div className="flex items-center border" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} className="w-9 h-9 flex items-center justify-center text-lg disabled:opacity-30" style={{ color: 'var(--text-primary)' }}>−</button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(selectedVariant?.stock || 1, qty + 1))} className="w-9 h-9 flex items-center justify-center text-lg" style={{ color: 'var(--text-primary)' }}>+</button>
            </div>
          </div>

          <div className="mb-6 p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} style={{ color: 'var(--crimson)' }} />
              <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Check Delivery</span>
            </div>
            <div className="flex gap-2">
              <input type="text" maxLength={6} value={pincode} onChange={e => { setPincode(e.target.value.replace(/\D/g,'')); setPincodeResult(null) }}
                placeholder="Enter pincode" className="input-base flex-1" style={{ height: 36, fontSize: 13 }} />
              <button onClick={checkPincode} disabled={pincode.length !== 6 || checkingPincode} className="btn-primary disabled:opacity-50" style={{ height: 36, padding: '0 16px', fontSize: 11, minWidth: 70 }}>
                {checkingPincode ? '...' : 'Check'}
              </button>
            </div>
            <AnimatePresence>
              {pincodeResult && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs mt-2" style={{ color: pincodeResult.available ? '#1B7A3E' : 'var(--crimson)' }}>
                  {pincodeResult.available ? `✔ ${pincodeResult.message}` : '✘ Delivery not available to this pincode'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3 mb-6">
            <motion.button className="btn-primary flex-1 justify-center" whileTap={{ scale: 0.98 }} onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0} style={{ opacity: !selectedVariant || selectedVariant.stock === 0 ? 0.5 : 1 }}>
              {!selectedVariant || selectedVariant.stock === 0 ? 'Out of Stock' : addedToCart ? <><Check size={14} /> Added!</> : <><ShoppingBag size={14} /> Add to Cart</>}
            </motion.button>
            <motion.button className="btn-outline px-4" whileTap={{ scale: 0.98 }} onClick={handleWishlist}>
              <Heart size={16} fill={wishlisted ? 'var(--crimson)' : 'none'} stroke={wishlisted ? 'var(--crimson)' : 'currentColor'} style={{ color: wishlisted ? 'var(--crimson)' : 'inherit' }} />
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[{ icon: <Truck size={16} />, text: `Free Shipping above ₹${Number(config.free_shipping_above).toLocaleString('en-IN')}` }, { icon: <RotateCcw size={16} />, text: `${config.return_window_days}-Day Returns` }, { icon: <Shield size={16} />, text: '100% Authentic' }].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-3 text-center border" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--crimson)' }}>{b.icon}</span>
                <span className="text-xs leading-tight" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{b.text}</span>
              </div>
            ))}
          </div>

          <div>
            <Accordion id="details" title="Product Details">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[['Fabric', product.fabric], ['Weave Type', product.weaveType], ['Origin', product.originRegion], ['Length', `${product.length} meters`], ['Weight', product.weightGrams ? `${product.weightGrams}g` : ''], ['Blouse Piece', product.blouseIncluded ? 'Included' : 'Not Included'], ['Occasion', product.occasion.join(', ')], ...Object.entries(product.customFields)].filter(([,v]) => v).map(([k,v]) => (
                  <><span key={`k-${k}`} style={{ color: 'var(--text-secondary)' }}>{k}</span><span key={`v-${k}`} style={{ color: 'var(--text-primary)' }}>{v}</span></>
                ))}
              </div>
            </Accordion>
            <Accordion id="description" title="Description"><p>{product.description}</p></Accordion>
            <Accordion id="care" title="Care Instructions"><p>{product.careInstructions}</p></Accordion>
            <Accordion id="shipping" title={`Shipping & Returns (${config.return_window_days} days)`}>
              <p>Free shipping on orders above ₹{Number(config.free_shipping_above).toLocaleString('en-IN')}. Standard delivery in {config.estimated_delivery_days} business days.</p>
              <p className="mt-2">Returns accepted within {config.return_window_days} days for <strong>unused and damaged goods only</strong>. Raise a return request from your orders page with a photo of the item.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="section-heading mb-8">Customer Reviews</h2>
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-56 flex-shrink-0">
            <div className="text-center p-6 border" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
              <p className="text-5xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)' }}>{product.averageRating || '—'}</p>
              <div className="flex justify-center gap-1 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < Math.round(product.averageRating) ? 'var(--gold)' : 'none'} stroke="var(--gold)" />)}</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            {reviews.length === 0 && <p className="text-sm py-6" style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to review this product!</p>}
            {reviews.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: 'var(--crimson)' }}>{r.userFullName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium">{r.userFullName}</p>
                      {r.isVerifiedPurchase && <p className="text-xs" style={{ color: '#1B7A3E' }}>✔ Verified Purchase</p>}
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-1 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < r.rating ? 'var(--gold)' : 'none'} stroke="var(--gold)" />)}</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>
              </motion.div>
            ))}

            {/* FIX #9: only show review form to logged-in users; show verified badge hint if purchased */}
            {userId && purchaseCheckDone && !reviewSubmitted ? (
              <div className="pt-2">
                <h3 className="text-lg font-light mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Write a Review</h3>
                {hasVerifiedPurchase && (
                  <p className="text-xs mb-4" style={{ color: '#1B7A3E' }}>✔ You purchased this product — your review will be marked as verified.</p>
                )}
                <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, i) => <button key={i} onClick={() => setReviewRating(i + 1)}><Star size={22} fill={i < reviewRating ? 'var(--gold)' : 'none'} stroke="var(--gold)" /></button>)}</div>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience with this saree..." className="input-base w-full mb-3" style={{ height: 100, padding: '12px 14px', resize: 'none' }} />
                <button className="btn-primary" onClick={submitReview} disabled={reviewSubmitting || !reviewText.trim()}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            ) : !userId && purchaseCheckDone ? (
              <div className="pt-2">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Link href={`/login?redirect=/product/${product.slug}`} style={{ color: 'var(--crimson)' }}>Sign in</Link> to leave a review.
                </p>
              </div>
            ) : reviewSubmitted ? (
              <div className="p-4 text-center border" style={{ background: 'var(--cream)', borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>✔ Thank you for your review!</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Sticky mobile Add to Cart bar */}
      <div className={`sticky-product-bar ${showStickyBar ? 'visible' : ''}`}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{product.name}</p>
          <p className="text-base font-semibold" style={{ color: 'var(--crimson)' }}>
            <span style={{ fontSize: '0.7em', verticalAlign: 'super', opacity: 0.8 }}>₹</span>
            {effectivePrice.toLocaleString('en-IN')}
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.stock === 0}
          className="btn-primary flex-shrink-0"
          style={{ padding: '10px 20px', fontSize: 11 }}>
          {!selectedVariant || selectedVariant.stock === 0 ? 'Out of Stock' : addedToCart ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="section-heading mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <ProductCard product={p} userId={userId} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
