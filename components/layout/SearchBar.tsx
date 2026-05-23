'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  slug: string
  fabric: string
  originalPrice: number
  salePrice: number | null
  image: string | null
  category: string
}

const POPULAR_SEARCHES = ['Kanjivaram Silk', 'Banarasi Saree', 'Wedding Silk', 'Cotton Saree', 'Georgette']
const RECENT_KEY = 'skss_recent_searches'

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5) } catch { return [] }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter(r => r.toLowerCase() !== q.toLowerCase())
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)))
  } catch {}
}

export default function SearchBar({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    setRecent(getRecent())
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, fabric, original_price, sale_price, categories(name), product_images(url, is_primary)')
        .eq('is_active', true)
        .or(`name.ilike.%${q}%,fabric.ilike.%${q}%,weave_type.ilike.%${q}%,origin_region.ilike.%${q}%`)
        .limit(6)

      setResults((data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        fabric: p.fabric,
        originalPrice: p.original_price,
        salePrice: p.sale_price,
        image: p.product_images?.find((i: any) => i.is_primary)?.url || p.product_images?.[0]?.url || null,
        category: p.categories?.name || '',
      })))
    } catch { setResults([]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  const go = (q: string) => {
    saveRecent(q)
    setRecent(getRecent())
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`)
    onClose()
  }

  const goProduct = (slug: string) => {
    router.push(`/product/${slug}`)
    onClose()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    const total = results.length
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, total - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) goProduct(results[activeIdx].slug)
      else if (query.trim()) go(query)
    }
    else if (e.key === 'Escape') onClose()
  }

  const showSuggestions = !query.trim()

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Input */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
          onKeyDown={handleKey}
          placeholder="Search sarees by name, fabric, occasion..."
          className="input-base pl-10 pr-10 w-full"
          style={{ height: 44, fontSize: 15 }}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            aria-label="Clear search">
            <X size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border shadow-xl overflow-hidden z-50"
        style={{ borderColor: 'var(--border)', borderRadius: 12, maxHeight: '70vh', overflowY: 'auto' }}>

        {/* Suggestions when empty */}
        {showSuggestions && (
          <div className="p-4">
            {recent.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Recent</p>
                  <button type="button" onClick={() => { try { localStorage.removeItem(RECENT_KEY) } catch {} setRecent([]) }} className="text-xs" style={{ color: 'var(--crimson)' }}>Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(r => (
                    <button type="button" key={r} onClick={() => { setQuery(r); search(r) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-full transition-all"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)'; (e.currentTarget as HTMLElement).style.color = 'var(--crimson)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}>
                      <Clock size={11} /> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map(s => (
                  <button type="button" key={s} onClick={() => { setQuery(s); search(s) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-full transition-all"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)'; (e.currentTarget as HTMLElement).style.color = 'var(--crimson)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}>
                    <TrendingUp size={11} /> {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {!showSuggestions && loading && (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-center">
                <div className="skeleton w-10 h-12 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!showSuggestions && !loading && results.length > 0 && (
          <div>
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </p>
            </div>
            {results.map((r, i) => {
              const price = r.salePrice ?? r.originalPrice
              const isOnSale = !!r.salePrice
              return (
                <button type="button" key={r.id} onClick={() => goProduct(r.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{ background: i === activeIdx ? 'var(--cream)' : 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cream)'; setActiveIdx(i) }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i === activeIdx ? 'var(--cream)' : 'transparent' }}>
                  <div className="w-10 h-12 flex-shrink-0 overflow-hidden rounded" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
                    {r.image
                      ? <Image src={r.image} alt={r.name} width={40} height={48} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-base">🥻</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.fabric}{r.category ? ` · ${r.category}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--crimson)' }}>{formatPrice(price)}</p>
                    {isOnSale && <p className="text-xs line-through" style={{ color: 'var(--text-secondary)' }}>{formatPrice(r.originalPrice)}</p>}
                  </div>
                </button>
              )
            })}
            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button type="button" onClick={() => go(query)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-lg transition-all"
                style={{ background: 'var(--cream)', color: 'var(--crimson)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--crimson)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                See all results for &ldquo;{query}&rdquo; <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* No results */}
        {!showSuggestions && !loading && results.length === 0 && query.trim() && (
          <div className="p-6 text-center">
            <p className="text-sm font-light mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>No results for &ldquo;{query}&rdquo;</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Try different keywords or browse our collections.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.slice(0, 3).map(s => (
                <button type="button" key={s} onClick={() => { setQuery(s); search(s) }}
                  className="px-3 py-1.5 text-xs border rounded-full"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
