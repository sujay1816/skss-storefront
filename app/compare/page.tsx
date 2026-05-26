'use client'
import { useCompareStore } from '@/lib/store/compare'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { X, ShoppingBag, Star } from 'lucide-react'
import { formatPrice, getEffectivePrice } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cart'
import Breadcrumb from '@/components/layout/Breadcrumb'
import toast from 'react-hot-toast'

const ROWS = [
  { label: 'Price',     key: 'price'   },
  { label: 'Fabric',    key: 'fabric'  },
  { label: 'Occasion',  key: 'occasion' },
  { label: 'Length',    key: 'length'  },
  { label: 'Weight',    key: 'weight'  },
  { label: 'Blouse',    key: 'blouse'  },
  { label: 'In Stock',  key: 'stock'   },
  { label: 'Rating',    key: 'rating'  },
]

export default function ComparePage() {
  const { items, remove, clear } = useCompareStore()
  const { addItem } = useCartStore()
  const router = useRouter()

  if (items.length === 0) return (
    <div className="page-container py-20 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>No products to compare</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Browse our collection and tick the compare icon on up to 3 sarees.</p>
      <Link href="/shop" className="btn-primary inline-flex">Browse Collection</Link>
    </div>
  )

  function getValue(p: any, key: string): string {
    const ep = getEffectivePrice(p)
    const isOnSale = ep < p.originalPrice
    switch (key) {
      case 'price':   return isOnSale ? `${formatPrice(ep)} (was ${formatPrice(p.originalPrice)})` : formatPrice(ep)
      case 'fabric':  return p.fabric || '—'
      case 'occasion': return Array.isArray(p.occasion) ? p.occasion.join(', ') : (p.occasion || '—')
      case 'length':  return p.length ? `${p.length}m` : '—'
      case 'weight':  return p.weightGrams ? `${p.weightGrams}g` : '—'
      case 'blouse':  return p.blouseIncluded ? 'Included' : 'Not included'
      case 'stock':   return p.isOutOfStock ? 'Out of stock' : `${p.totalStock} available`
      case 'rating':  return p.reviewCount > 0 ? `★ ${p.averageRating} (${p.reviewCount})` : 'No reviews yet'
      default:        return '—'
    }
  }

  function isHighlighted(key: string, idx: number): boolean {
    if (key === 'price') {
      const prices = items.map(p => getEffectivePrice(p))
      return getEffectivePrice(items[idx]) === Math.min(...prices)
    }
    if (key === 'rating') {
      const ratings = items.map(p => p.averageRating || 0)
      return (items[idx].averageRating || 0) === Math.max(...ratings) && Math.max(...ratings) > 0
    }
    if (key === 'stock') return !items[idx].isOutOfStock
    return false
  }

  return (
    <div className="page-container py-8 max-w-5xl">
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Compare' }]} />

      <div className="flex items-center justify-between mt-6 mb-8">
        <h1 className="text-2xl font-light" style={{ fontFamily: 'var(--font-heading)' }}>
          Compare <em>Sarees</em>
        </h1>
        <button type="button" onClick={clear} className="text-xs font-medium transition-colors"
          style={{ color: 'var(--crimson)' }}>
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full" style={{ minWidth: items.length * 200 + 140 }}>
          <thead>
            <tr>
              <th className="text-left pb-4 pr-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-secondary)', width: 120 }}>
              </th>
              {items.map(p => {
                const img = p.images?.find(i => i.isPrimary) || p.images?.[0]
                const ep  = getEffectivePrice(p)
                const v   = p.variants?.[0]
                return (
                  <th key={p.id} className="pb-4 px-3 text-left align-top" style={{ width: 200 }}>
                    <div className="relative">
                      <button type="button" onClick={() => remove(p.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-10"
                        aria-label={`Remove ${p.name}`}>
                        <X size={12} />
                      </button>
                      <Link href={`/product/${p.slug}`}>
                        <div className="relative rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '2/3', background: 'var(--cream)' }}>
                          {img ? <Image src={img.url} alt={p.name} fill className="object-cover" sizes="180px" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🥻</div>}
                        </div>
                        <p className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{p.name}</p>
                      </Link>
                      {!p.isOutOfStock && v && (
                        <button type="button"
                          onClick={() => {
                            addItem({ productId: p.id, productName: p.name, productSlug: p.slug, productImage: img?.url || '', colour: v.colour, colourHex: v.colourHex, originalPrice: p.originalPrice, salePrice: p.salePrice, quantity: 1, stock: v.stock, gstRate: p.gstRate })
                            toast.success('Added to cart!', { icon: '🛍️', className: 'toast-brand toast-success-brand' })
                          }}
                          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium rounded mt-2"
                          style={{ background: 'var(--crimson)', color: 'white' }}>
                          <ShoppingBag size={12} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.key} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="py-4 pr-4 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                  {row.label}
                </td>
                {items.map((p, i) => {
                  const val  = getValue(p, row.key)
                  const high = isHighlighted(row.key, i)
                  return (
                    <td key={p.id} className="py-4 px-3 text-sm" style={{ verticalAlign: 'middle' }}>
                      <span className={high ? 'font-semibold' : ''} style={{ color: high ? 'var(--crimson)' : 'var(--text-primary)' }}>
                        {row.key === 'rating' && p.reviewCount > 0 && <Star size={11} className="inline mr-0.5" style={{ color: 'var(--gold)', fill: 'var(--gold)' }} />}
                        {val}
                        {high && row.key === 'price' && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: '#EAF6ED', color: '#15803D' }}>Best price</span>}
                        {high && row.key === 'rating' && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: '#FFF8E7', color: '#92400E' }}>Top rated</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
