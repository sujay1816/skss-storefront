'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import type { Product } from '@/types'

const STORAGE_KEY = 'skss_recently_viewed'
const MAX_ITEMS = 6

// Call this on every product page to record the view
export function recordRecentlyViewed(product: Product) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: Product[] = raw ? JSON.parse(raw) : []
    // Remove if already present, then prepend
    const filtered = existing.filter(p => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const all: Product[] = raw ? JSON.parse(raw) : []
      // Exclude the currently-viewed product
      setProducts(all.filter(p => p.id !== currentProductId))
    } catch {}
  }, [currentProductId])

  if (products.length === 0) return null

  return (
    <section style={{ background: 'var(--ivory)', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <div className="page-container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>Your History</p>
            <h2 className="section-heading">Recently Viewed</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {products.map(product => {
          const effectivePrice = getEffectivePrice(product)
          const isOnSale = effectivePrice < product.originalPrice
          const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0]
          return (
            <Link key={product.id} href={`/product/${product.slug}`} className="group">
              <div className="overflow-hidden border transition-shadow duration-300 hover:shadow-md"
                style={{ borderColor: 'var(--border)', borderRadius: 4 }}>
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', background: 'var(--cream)' }}>
                  {primaryImage?.url ? (
                    <Image
                      src={primaryImage.url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🥻</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-light truncate" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                    {product.name}
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-semibold" style={{ color: 'var(--crimson)' }}>
                      {formatPrice(effectivePrice)}
                    </span>
                    {isOnSale && (
                      <span className="text-xs line-through" style={{ color: 'var(--text-secondary)' }}>
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      </div>
    </section>
  )
}
