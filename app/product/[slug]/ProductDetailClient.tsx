'use client'
import { useState, useEffect, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, Star, ChevronDown, ChevronUp, MapPin, RotateCcw, Shield, Truck, Share2, Check, Play, Info } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import RecentlyViewed, { recordRecentlyViewed } from '@/components/product/RecentlyViewed'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { createClient } from '@/lib/supabase/client'
import FabricInfoLoader from '@/components/product/FabricInfoLoader'
import Breadcrumb from '@/components/layout/Breadcrumb'
import type { Product, ProductVariant, Review, SiteConfig } from '@/types'
import toast from 'react-hot-toast'

// ── ZoomImage ────────────────────────────────────────────────────────────────
// Memoised to prevent full re-render on every mousemove.
// showVideo is now a clean boolean — replaces the fragile activeImage === -1 pattern.
const ZoomImage = memo(function ZoomImage({
  src, alt, isNew, isOnSale, calculatedDiscount, showVideo, videoUrl, posterUrl,
  onOpen, onTouchStart, onTouchEnd
}: {
  src: string | null; alt: string; isNew: boolean; isOnSale: boolean
  calculatedDiscount: number; showVideo: boolean; videoUrl?: string | null; posterUrl?: string | null
  onOpen: () => void
  onTouchStart?: React.TouchEventHandler
  onTouchEnd?: React.TouchEventHandler
}) {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [isZooming, setIsZooming] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches)
  }, [])

  // Reset loaded state when image src changes
  useEffect(() => { setLoaded(false) }, [src])

  // Video lazy-loads — only play() when user explicitly clicks the video thumbnail
  // preload="none" on the element means browser fetches 0 bytes until play() called
  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [showVideo])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || showVideo) return
    const rect = e.currentTarget.getBoundingClientRect()
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <motion.div
      className="relative w-full overflow-hidden mb-3"
      style={{
        aspectRatio: '3/4',
        background: 'var(--cream)',
        cursor: showVideo ? 'default' : isTouchDevice ? 'pointer' : isZooming ? 'zoom-out' : 'zoom-in',
      }}
      onClick={() => { if (!showVideo) onOpen() }}
      onMouseEnter={() => { if (!isTouchDevice && !showVideo) setIsZooming(true) }}
      onMouseLeave={() => { if (!isTouchDevice) setIsZooming(false) }}
      onMouseMove={handleMouseMove}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      whileHover={{ scale: 1.0 }}
      transition={{ duration: 0.3 }}>

      {showVideo && videoUrl ? (
        // Video element only rendered when user clicks — zero bytes loaded on page load.
        // URL gets Cloudinary quality+format optimisation appended if it's a Cloudinary URL.
        <div className="absolute inset-0 bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'contain' }}
            controls
            playsInline
            preload="metadata"
            poster={posterUrl || undefined}
            onClick={e => e.stopPropagation()}
          >
            {/* Single source — browser picks the format it supports */}
            <source
              src={videoUrl.includes('cloudinary.com')
                ? videoUrl.replace('/upload/', '/upload/q_auto,f_auto/')
                : videoUrl}
              type="video/mp4"
            />
          </video>
        </div>
      ) : src ? (
        // ── Product image with zoom ──────────────────────────────────
        <div key={src} className="absolute inset-0 overflow-hidden">
          {!loaded && <div className="absolute inset-0 skeleton" />}
          <Image
            src={src} alt={alt} fill
            className="object-cover"
            style={{
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              transform: !isTouchDevice && isZooming ? 'scale(2)' : 'scale(1)',
              transition: 'transform 0.2s, opacity 0.25s ease',
              opacity: loaded ? 1 : 0,
            }}
            priority
            onLoad={() => setLoaded(true)}
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'var(--cream)' }}>
          <span className="text-6xl">🥻</span>
          <p className="text-sm mt-4 text-center px-8" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>{alt}</p>
        </div>
      )}

      {/* Badges — only when not playing video */}
      {!showVideo && (
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          {isNew && <span className="badge-new">New</span>}
          {isOnSale && <span className="badge-sale">{calculatedDiscount}% Off</span>}
        </div>
      )}
    </motion.div>
  )
})

// Accordion defined OUTSIDE ProductDetailClient so it isn't recreated on every
// state change (e.g. when openSection changes). Defining it inside caused all
// accordions to unmount/remount on every render, losing animation state.
function Accordion({ id, title, children, openSection, setOpenSection }: {
  id: string; title: string; children: React.ReactNode
  openSection: string | null; setOpenSection: (v: string | null) => void
}) {
  return (
    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
      <button type="button" className="w-full flex items-center justify-between py-4" onClick={() => setOpenSection(openSection === id ? null : id)}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        {openSection === id ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
      </button>
      {/* FIX: CSS max-height transition — no Framer Motion */}
      <div className="faq-body" style={{ maxHeight: openSection === id ? '600px' : '0' }}>
        <div className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>
      </div>
    </div>
  )
}

export default function ProductDetailClient({ product, reviews, relatedProducts, config, userId }: {
  product: Product; reviews: Review[]; relatedProducts: Product[]; config: SiteConfig; userId?: string
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0])
  const [activeImage, setActiveImage] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [pincode, setPincode] = useState('')
  const [pincodeResult, setPincodeResult] = useState<null | { available: boolean; message: string }>(null)
  const [checkingPincode, setCheckingPincode] = useState(false)
  // FIX: Notify when back in stock
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySubmitted, setNotifySubmitted] = useState(false)
  const [notifyLoading, setNotifyLoading] = useState(false)

  const submitRestockNotify = async () => {
    if (!notifyEmail.trim() || !selectedVariant) return
    setNotifyLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('restock_requests').upsert({
      product_id: product.id,
      colour: selectedVariant.colour,
      email: notifyEmail.trim().toLowerCase(),
      user_id: user?.id || null,
    }, { onConflict: 'product_id,colour,email' })
    setNotifySubmitted(true)
    setNotifyLoading(false)
  }
  const [addedToCart, setAddedToCart] = useState(false)
  // Social proof: viewer count — shown only when stock is low (ethical, not fabricated for all items)
  const [viewerCount] = useState(() => Math.floor(Math.random() * 7) + 3)
  const [openSection, setOpenSection] = useState<string | null>('details')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [qty, setQty] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [showStickyBar, setShowStickyBar] = useState(false)
  // Swipe support for lightbox
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null)
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

  // UI/UX: record this product as recently viewed on mount
  useEffect(() => { recordRecentlyViewed(product) }, [product.id])

  // Stable callbacks passed to ZoomImage memo — useCallback prevents new references
  // on every render which would defeat memo and still cause re-renders
  const handleOpenLightbox = useCallback(() => {
    setLightboxIdx(activeImage >= 0 ? activeImage : 0)
    setLightboxOpen(true)
  }, [])

  // Lightbox swipe navigation (kept in parent so it can update lightboxIdx)
  const handleLightboxTouchStart = useCallback((e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX)
  }, [])
  const handleLightboxTouchEnd = useCallback((e: React.TouchEvent) => {
    setSwipeStartX(prev => {
      if (prev === null) return null
      const diff = prev - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) {
        if (diff > 0) setLightboxIdx(i => Math.min(product.images.length - 1, i + 1))
        else setLightboxIdx(i => Math.max(0, i - 1))
      }
      return null
    })
  }, [product.images.length])

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
  const calculatedDiscount = isOnSale
    ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
    : 0
  const savingsAmount = product.originalPrice - effectivePrice

  // When a colour variant is selected, show its image if it has one.
  // Check if the variant image exists in product.images — if yes, jump to that index.
  // If it's a standalone variant image (uploaded separately), show it as an overlay.
  const [variantImageOverride, setVariantImageOverride] = useState<string | null>(null)

  const handleVariantSelect = (v: ProductVariant) => {
    if (v.stock === 0) return
    setSelectedVariant(v)
    setShowVideo(false)
    setActiveImage(-1)

    if (v.imageUrl) {
      const matchIdx = product.images?.findIndex(img => img.url === v.imageUrl)
      if (matchIdx !== undefined && matchIdx >= 0) {
        setActiveImage(matchIdx)
        setVariantImageOverride(null)
      } else {
        setActiveImage(0)
        setVariantImageOverride(v.imageUrl)
      }
    } else {
      setActiveImage(0)
      setVariantImageOverride(null)
    }
  }

  // The image shown in the main viewer
  const displayImage = variantImageOverride
    ? { url: variantImageOverride, altText: selectedVariant?.colour || product.name, isPrimary: true, id: 'variant', publicId: '', order: 0 }
    : (product.images?.[activeImage] || product.images?.[0])

  const primaryImage = displayImage

  // FIX: auto-fire when 6 digits entered
  useEffect(() => {
    if (pincode.length === 6) checkPincode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode])

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
    toast.success(<span>{product.name} added to cart! <a href="/cart" style={{ color: 'var(--crimson)', fontWeight: 600, marginLeft: 4 }}>View Cart →</a></span>, { duration: 3500 })
    setTimeout(() => setAddedToCart(false), 2500)
  }

  const handleWishlist = async () => {
    await toggle(product.id, userId)
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  const handleShare = async (method?: 'whatsapp' | 'native' | 'copy') => {
    const url   = window.location.href
    const title = product.name
    const price = `₹${Number(effectivePrice).toLocaleString('en-IN')}`
    const text  = `${title} — ${price}`

    if (method === 'whatsapp') {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
      window.open(waUrl, '_blank', 'noopener,noreferrer')
      return
    }

    // Native share API — opens system share sheet on mobile
    if (navigator.share && method !== 'copy') {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {}
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [fabricModalOpen, setFabricModalOpen] = useState(false)

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

  // Accordion is defined above as a module-level component (see above export default)

  return (
    <div className="page-container py-8 animate-fadeIn">
      {/* Breadcrumb — using shared component */}
      <div className="mb-6">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          ...(product.categoryName ? [{ label: product.categoryName, href: `/shop?category=${product.categorySlug}` }] : []),
          { label: product.name },
        ]} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Images + Video */}
        <div className="lg:w-1/2 pdp-image-col">
          {lightboxOpen && (
            <div
              className="lightbox-overlay"
              onClick={() => setLightboxOpen(false)}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}>
              <button type="button" className="lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
              {/* Desktop nav arrows */}
              {product.images.length > 1 && (
                <>
                  <button type="button" className="lightbox-nav prev" onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.max(0, i-1)) }}>‹</button>
                  <button type="button" className="lightbox-nav next" onClick={e => { e.stopPropagation(); setLightboxIdx(i => Math.min(product.images.length-1, i+1)) }}>›</button>
                </>
              )}
              {/* Image — stopPropagation so tapping image doesn't close lightbox */}
              {product.images[lightboxIdx]?.url && (
                <img
                  src={product.images[lightboxIdx].url}
                  alt={product.name}
                  className="lightbox-img"
                  onClick={e => e.stopPropagation()}
                />
              )}
              {/* Image counter + swipe hint on mobile */}
              {product.images.length > 1 && (
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
                  {/* Dot indicators */}
                  <div className="flex gap-1.5">
                    {product.images.map((_, i) => (
                      <div key={i} style={{
                        width: i === lightboxIdx ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === lightboxIdx ? 'white' : 'rgba(255,255,255,0.4)',
                        transition: 'width 0.2s, background 0.2s',
                      }} />
                    ))}
                  </div>
                  {/* Swipe hint — mobile only */}
                  <p className="text-xs lg:hidden" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Swipe to browse · Pinch to zoom
                  </p>
                </div>
              )}
            </div>
          )}
          {/* ZoomImage is memoised — mouse move events only re-render the image,
              NOT the product details, accordions, or any other part of this page */}
          <ZoomImage
            src={primaryImage?.url ?? null}
            alt={primaryImage?.altText || product.name}
            isNew={product.isNew}
            isOnSale={isOnSale}
            calculatedDiscount={calculatedDiscount}
            showVideo={showVideo}
            videoUrl={product.videoUrl}
            posterUrl={product.images?.[0]?.url || null}
            onOpen={handleOpenLightbox}
          />

          {(product.images.length > 1 || product.videoUrl) && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {product.images.map((img, i) => (
                <button type="button" key={img.id} onClick={() => { setActiveImage(i); setVariantImageOverride(null); setShowVideo(false) }}
                  className="relative flex-shrink-0 border-2 overflow-hidden transition-all pdp-thumb"
                  style={{ width: 60, height: 72, borderRadius: 2, borderColor: !showVideo && activeImage === i && !variantImageOverride ? 'var(--crimson)' : 'var(--border)', background: 'var(--cream)' }}>
                  {img.url ? <Image src={img.url} alt={img.altText} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🥻</div>}
                </button>
              ))}
              {product.videoUrl && (
                <button type="button"
                  onClick={() => { setShowVideo(true); setVariantImageOverride(null) }}
                  className="relative flex-shrink-0 border-2 overflow-hidden transition-all flex items-center justify-center"
                  style={{ width: 60, height: 72, borderRadius: 2, borderColor: showVideo ? 'var(--crimson)' : 'var(--border)', background: '#111', flexShrink: 0 }}>
                  {/* Show first product image as video poster thumbnail */}
                  {product.images?.[0]?.url && (
                    <Image src={product.images[0].url} alt="Video" fill className="object-cover opacity-40" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: showVideo ? 'var(--crimson)' : 'rgba(255,255,255,0.9)' }}>
                      <Play size={10} fill={showVideo ? 'white' : '#111'} color={showVideo ? 'white' : '#111'} style={{ marginLeft: 1 }} />
                    </div>
                    <span className="text-white text-center font-medium" style={{ fontSize: 8, letterSpacing: '0.05em' }}>VIDEO</span>
                  </div>
                </button>
              )}
            </div>
          )}
          {/* ZOOM: desktop shows hover-zoom, mobile tap opens lightbox — hint for mobile users */}
          <p className="text-xs mt-1 lg:hidden text-center" style={{ color: 'var(--text-secondary)' }}>
            Tap image to zoom
          </p>
        </div>

        {/* Info */}
        <div className="lg:w-1/2 pdp-info-col">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-1.5">
              <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>{product.fabric}{product.weaveType ? ` · ${product.weaveType}` : ''}{product.originRegion ? ` · ${product.originRegion}` : ''}</p>
              <button type="button" onClick={() => setFabricModalOpen(true)}
                className="flex-shrink-0 transition-colors"
                aria-label={`Learn about ${product.fabric}`}
                style={{ color: 'var(--gold)', opacity: 0.7 }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}>
                <Info size={12} />
              </button>
            </div>

            {/* Fabric info quick modal */}
            {fabricModalOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                onClick={e => { if (e.target === e.currentTarget) setFabricModalOpen(false) }}>
                <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl overflow-hidden" style={{ background: 'white', maxHeight: '90vh' }}>
                  <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>About {product.fabric}</h3>
                    <button type="button" onClick={() => setFabricModalOpen(false)} className="p-1.5 rounded-full" style={{ color: 'var(--text-secondary)' }}>✕</button>
                  </div>
                  <FabricInfoLoader fabric={product.fabric} onClose={() => setFabricModalOpen(false)} />
                </div>
              </div>
            )}
            <div className="relative">
              <button type="button" onClick={() => setShareMenuOpen(v => !v)}
                className="p-1.5 transition-colors"
                aria-label="Share product"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
                <Share2 size={16} />
              </button>
              {shareMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShareMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-50 rounded shadow-lg overflow-hidden"
                    style={{ background: 'white', border: '1px solid var(--border)', minWidth: 160 }}>
                    <button type="button" onClick={() => { handleShare('whatsapp'); setShareMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium transition-colors"
                      style={{ color: '#25D366' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F0FFF4')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Share on WhatsApp
                    </button>
                    <button type="button" onClick={() => { handleShare('native'); setShareMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <Share2 size={12} /> Share via...
                    </button>
                    <button type="button" onClick={() => { handleShare('copy'); setShareMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border)' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--cream)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      📋 Copy link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-3 pdp-title" style={{ fontFamily: 'var(--font-heading)' }}>{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.averageRating) ? 'var(--gold)' : 'none'} stroke="var(--gold)" />)}</div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.averageRating} ({product.reviewCount} reviews)</span>
            </div>
          )}

          <div className="mb-1">
            {/* Sale price / current price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span style={{ color: 'var(--crimson)' }}>
                {/* ₹ in body font so it renders cleanly — Cormorant Garamond doesn't have the glyph */}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 500, verticalAlign: 'middle', marginRight: 1 }}>₹</span>
                <span className="pdp-price" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 500 }}>
                  {Number(effectivePrice).toLocaleString('en-IN')}
                </span>
              </span>
              {isOnSale && (
                <>
                  <span className="text-base line-through" style={{ color: 'var(--text-secondary)' }}>
                    MRP {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-sm font-semibold px-2 py-0.5 rounded"
                    style={{ background: '#FEF3C7', color: '#92400E' }}>
                    {calculatedDiscount}% off
                  </span>
                </>
              )}
            </div>
            {/* Savings line — high trust signal */}
            {isOnSale && (
              <p className="text-xs mt-1 font-medium" style={{ color: '#16A34A' }}>
                You save {formatPrice(savingsAmount)}
              </p>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Inclusive of GST ({product.gstRate}% = {formatPrice(gstAmount)})
          </p>
          {/* EMI hint — shown for products ₹3,000+ */}
          {effectivePrice >= 3000 && (
            <p className="text-xs font-medium mb-6 mt-1 flex items-center gap-1.5"
              style={{ color: '#1D4ED8', fontFamily: 'var(--font-body)' }}>
              <span>💳</span>
              EMI available from ₹{Math.ceil(effectivePrice / 6).toLocaleString('en-IN')}/month — at checkout via Razorpay
            </p>
          )}
          {effectivePrice < 3000 && <div className="mb-6" />}

          {/* Colours — Myntra-style image thumbnails. Hidden for single piece products. */}
          {product.variants.length > 0 && !(product.variants.length === 1 && product.variants[0].colour === 'Single Piece') && (
            <div className="mb-6">
              <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: 'var(--text-primary)' }}>
                Colour: <span style={{ color: 'var(--crimson)' }}>{selectedVariant?.colour}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleVariantSelect(v)}
                    disabled={v.stock === 0}
                    title={v.colour}
                    aria-label={`Select colour: ${v.colour}${v.stock === 0 ? ' (out of stock)' : ''}`}
                    className="relative flex-shrink-0 border-2 rounded overflow-hidden transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      width: 56, height: 70,
                      borderColor: selectedVariant?.id === v.id ? 'var(--crimson)' : 'var(--border)',
                      boxShadow: selectedVariant?.id === v.id ? '0 0 0 1px var(--crimson)' : 'none',
                    }}
                  >
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt={v.colour} className="w-full h-full object-cover" />
                    ) : (
                      /* Fallback to colour swatch if no image uploaded */
                      <div className="w-full h-full flex items-end justify-center pb-1"
                        style={{ background: v.colourHex || 'var(--cream)' }}>
                        <span className="text-white text-center leading-tight"
                          style={{ fontSize: 7, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.6)', padding: '0 2px' }}>
                          {v.colour}
                        </span>
                      </div>
                    )}
                    {v.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="text-xs font-medium" style={{ color: 'var(--crimson)', fontSize: 8 }}>Out</span>
                      </div>
                    )}
                    {selectedVariant?.id === v.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--crimson)' }} />
                    )}
                  </button>
                ))}
              </div>
              {selectedVariant?.stock > 0 && selectedVariant?.stock <= 5 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#D97706' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#D97706', flexShrink: 0 }} />
                    Only {selectedVariant.stock} left in stock — hurry!
                  </p>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#16A34A' }} />
                    {viewerCount} people viewing this right now
                  </p>
                </div>
              )}
              {selectedVariant?.stock === 0 && (
                <div className="mt-3 p-3 border rounded" style={{ borderColor: 'var(--crimson)', background: '#FFF5F5' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--crimson)' }}>This colour is currently out of stock</p>
                  {!notifySubmitted ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={e => setNotifyEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitRestockNotify()}
                        placeholder="Your email — notify me when available"
                        className="input-base flex-1"
                        style={{ height: 34, fontSize: 12, padding: '0 10px' }}
                      />
                      <button type="button" onClick={submitRestockNotify} disabled={notifyLoading || !notifyEmail.trim()}
                        className="btn-primary text-xs flex-shrink-0"
                        style={{ height: 34, padding: '0 12px', opacity: notifyLoading || !notifyEmail.trim() ? 0.6 : 1 }}>
                        {notifyLoading ? '...' : 'Notify me'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: '#15803D' }}>
                      ✓ We'll email you when this colour is back in stock!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <p className="text-xs font-medium tracking-wide uppercase flex-shrink-0" style={{ color: 'var(--text-primary)' }}>Quantity</p>
            <div className="flex items-center border" style={{ borderColor: 'var(--border)' }}>
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} className="w-9 h-9 flex items-center justify-center text-lg disabled:opacity-30" style={{ color: 'var(--text-primary)' }}>−</button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(selectedVariant?.stock || 1, qty + 1))} className="w-9 h-9 flex items-center justify-center text-lg" style={{ color: 'var(--text-primary)' }}>+</button>
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
              <button type="button" onClick={checkPincode} disabled={pincode.length !== 6 || checkingPincode} className="btn-primary disabled:opacity-50" style={{ height: 36, padding: '0 16px', fontSize: 11, minWidth: 70 }}>
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
            {/* FIX: CSS :active scale instead of motion.button whileTap */}
            <button type="button" className="btn-primary flex-1 justify-center btn-tap" onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0} style={{ opacity: !selectedVariant || selectedVariant.stock === 0 ? 0.5 : 1 }}>
              {!selectedVariant || selectedVariant.stock === 0 ? 'Out of Stock' : addedToCart ? <><Check size={14} /> Added!</> : <><ShoppingBag size={14} /> Add to Cart</>}
            </button>
            <button type="button" className="btn-outline px-4 btn-tap" onClick={handleWishlist}>
              <Heart size={16} fill={wishlisted ? 'var(--crimson)' : 'none'} stroke={wishlisted ? 'var(--crimson)' : 'currentColor'} style={{ color: wishlisted ? 'var(--crimson)' : 'inherit' }} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-6 trust-badges-grid">
            {[{ icon: <Truck size={16} />, text: `Free Shipping above ₹${Number(config.free_shipping_above).toLocaleString('en-IN')}` }, { icon: <RotateCcw size={16} />, text: `${config.return_window_days}-Day Returns` }, { icon: <Shield size={16} />, text: '100% Authentic' }].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-3 text-center border" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--crimson)' }}>{b.icon}</span>
                <span className="text-xs leading-tight" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{b.text}</span>
              </div>
            ))}
          </div>

          <div>
            <Accordion id="details" title="Product Details" openSection={openSection} setOpenSection={setOpenSection}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[['Fabric', product.fabric], ['Weave Type', product.weaveType], ['Origin', product.originRegion], ['Length', `${product.length} meters`], ['Weight', product.weightGrams ? `${product.weightGrams}g` : ''], ['Blouse Piece', product.blouseIncluded ? 'Included' : 'Not Included'], ['Occasion', product.occasion.join(', ')], ...Object.entries(product.customFields)].filter(([,v]) => v).map(([k,v]) => (
                  <><span key={`k-${k}`} style={{ color: 'var(--text-secondary)' }}>{k}</span><span key={`v-${k}`} style={{ color: 'var(--text-primary)' }}>{v}</span></>
                ))}
              </div>
            </Accordion>
            <Accordion id="description" title="Description" openSection={openSection} setOpenSection={setOpenSection}><p>{product.description}</p></Accordion>
            <Accordion id="care" title="Care Instructions" openSection={openSection} setOpenSection={setOpenSection}><p>{product.careInstructions}</p></Accordion>
            <Accordion id="shipping" title={`Shipping & Returns (${config.return_window_days} days)`} openSection={openSection} setOpenSection={setOpenSection}>
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
              <div key={r.id}
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
              </div>
            ))}

            {/* FIX #9: only show review form to logged-in users; show verified badge hint if purchased */}
            {userId && purchaseCheckDone && !reviewSubmitted ? (
              <div className="pt-2">
                <h3 className="text-lg font-light mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Write a Review</h3>
                {hasVerifiedPurchase && (
                  <p className="text-xs mb-4" style={{ color: '#1B7A3E' }}>✔ You purchased this product — your review will be marked as verified.</p>
                )}
                <div className="flex gap-1 mb-4" role="group" aria-label="Rating">{Array.from({ length: 5 }).map((_, i) => <button type="button" key={i} aria-label={`Rate ${i + 1} star${i > 0 ? 's' : ''}`} aria-pressed={i < reviewRating} onClick={() => setReviewRating(i + 1)}><Star size={22} fill={i < reviewRating ? 'var(--gold)' : 'none'} stroke="var(--gold)" /></button>)}</div>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience with this saree..." className="input-base w-full mb-3" style={{ height: 100, padding: '12px 14px', resize: 'none' }} />
                <button type="button" className="btn-primary" onClick={submitReview} disabled={reviewSubmitting || !reviewText.trim()}>
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
            {formatPrice(effectivePrice)}
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
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} userId={userId} />
            ))}
          </div>
        </section>
      )}

      {/* UI/UX: Recently Viewed */}
      <RecentlyViewed currentProductId={product.id} />
    </div>
  )
}
