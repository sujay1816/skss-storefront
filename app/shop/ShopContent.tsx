'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { Product, Category, SiteConfig } from '@/types'
import { formatPrice } from '@/lib/utils'

const DEFAULT_FABRICS = ['Silk','Cotton','Georgette','Chiffon','Linen','Organza','Net','Crepe','Tussar','Chanderi']
const OCCASIONS = ['Wedding','Festive','Casual','Office','Party','Religious','Daily Wear']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Best Discount' },
]

const PAGE_SIZE = 16

// Issue 2 fix — skeleton card for loading state
const SkeletonCard = () => (
  <div className="bg-white overflow-hidden" style={{ border: '1px solid var(--border)', borderRadius: 4 }}>
    <div className="skeleton" style={{ aspectRatio: '3/4' }} />
    <div className="p-3 space-y-2">
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-4 w-4/5 rounded" />
      <div className="skeleton h-4 w-1/3 rounded" />
    </div>
  </div>
)

export default function ShopContent({ products, categories, config, userId, initialCategory, initialSearch, isLoading, fabrics: fabricsProp }: {
  products: Product[]; categories: Category[]; config: SiteConfig; userId?: string;
  initialCategory?: string; initialSearch?: string; isLoading?: boolean; fabrics?: string[]
}) {
  const fabrics = fabricsProp && fabricsProp.length > 0 ? fabricsProp : DEFAULT_FABRICS
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState(initialSearch || '')
  const [searchInput, setSearchInput] = useState(initialSearch || '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '')
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
    setPage(1)
  }

  const filtered = useMemo(() => {
    let p = [...products]
    if (search) p = p.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.fabric.toLowerCase().includes(search.toLowerCase()) || x.originRegion.toLowerCase().includes(search.toLowerCase()))
    if (selectedCategory) p = p.filter(x => x.categorySlug === selectedCategory)
    if (selectedFabrics.length) p = p.filter(x => selectedFabrics.includes(x.fabric))
    if (selectedOccasions.length) p = p.filter(x => x.occasion.some(o => selectedOccasions.includes(o)))
    if (priceMin) p = p.filter(x => x.originalPrice >= Number(priceMin))
    if (priceMax) p = p.filter(x => x.originalPrice <= Number(priceMax))
    if (onlyNew) p = p.filter(x => x.isNew)
    if (onlyInStock) p = p.filter(x => !x.isOutOfStock)
    switch (sortBy) {
      case 'price_asc': return p.sort((a,b) => a.originalPrice - b.originalPrice)
      case 'price_desc': return p.sort((a,b) => b.originalPrice - a.originalPrice)
      case 'rating': return p.sort((a,b) => b.averageRating - a.averageRating)
      case 'discount': return p.sort((a,b) => (b.discountPercent||0) - (a.discountPercent||0))
      default: return p
    }
  }, [products, search, selectedCategory, selectedFabrics, selectedOccasions, priceMin, priceMax, onlyNew, onlyInStock, sortBy])

  // Issue 5 fix — pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeCount = (selectedCategory ? 1 : 0) + selectedFabrics.length + selectedOccasions.length + (priceMin || priceMax ? 1 : 0) + (onlyNew ? 1 : 0) + (onlyInStock ? 1 : 0)
  const clearAll = () => { setSelectedCategory(''); setSelectedFabrics([]); setSelectedOccasions([]); setPriceMin(''); setPriceMax(''); setOnlyNew(false); setOnlyInStock(false); setPage(1) }

  // Issue 9 fix — search submit handler
  const handleSearchSubmit = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="pb-5 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
      <h4 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      {children}
    </div>
  )

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="px-3 py-1.5 text-xs border transition-all duration-150"
      style={{ borderColor: active ? 'var(--crimson)' : 'var(--border)', background: active ? 'var(--crimson)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)' }}>
      {label}
    </button>
  )

  const Filters = () => (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Filters {activeCount > 0 && `(${activeCount})`}</h3>
        {activeCount > 0 && <button onClick={clearAll} className="text-xs" style={{ color: 'var(--crimson)' }}>Clear All</button>}
      </div>
      <FilterSection title="Category">
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All" active={!selectedCategory} onClick={() => { setSelectedCategory(''); setPage(1) }} />
          {categories.map(c => <FilterChip key={c.id} label={c.name} active={selectedCategory === c.slug} onClick={() => { setSelectedCategory(selectedCategory === c.slug ? '' : c.slug); setPage(1) }} />)}
        </div>
      </FilterSection>
      <FilterSection title="Fabric">
        <div className="flex flex-wrap gap-2">{fabrics.map(f => <FilterChip key={f} label={f} active={selectedFabrics.includes(f)} onClick={() => toggleFilter(selectedFabrics, f, setSelectedFabrics)} />)}</div>
      </FilterSection>
      <FilterSection title="Occasion">
        <div className="flex flex-wrap gap-2">{OCCASIONS.map(o => <FilterChip key={o} label={o} active={selectedOccasions.includes(o)} onClick={() => toggleFilter(selectedOccasions, o, setSelectedOccasions)} />)}</div>
      </FilterSection>
      <FilterSection title="Price Range">
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min ₹" value={priceMin} onChange={e => { setPriceMin(e.target.value); setPage(1) }} className="input-base flex-1" style={{ height: 36, fontSize: 12 }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>to</span>
          <input type="number" placeholder="Max ₹" value={priceMax} onChange={e => { setPriceMax(e.target.value); setPage(1) }} className="input-base flex-1" style={{ height: 36, fontSize: 12 }} />
        </div>
      </FilterSection>
      <FilterSection title="Quick Filters">
        <div className="space-y-2">
          {[['New Arrivals', onlyNew, () => { setOnlyNew(!onlyNew); setPage(1) }], ['In Stock Only', onlyInStock, () => { setOnlyInStock(!onlyInStock); setPage(1) }]].map(([label, checked, onChange]: any) => (
            <label key={label as string} className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 accent-crimson" style={{ accentColor: 'var(--crimson)' }} />
              {label}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  )

  return (
    <div className="page-container py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-heading">Our Collection</h1>
          {/* Issue 2 & 5 fix — show product count and page info */}
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isLoading ? 'Loading...' : `${filtered.length} sarees found${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Issue 9 fix — search with submit button */}
          <div className="relative flex">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
              placeholder="Search..."
              className="input-base pl-9"
              style={{ height: 36, width: 160, fontSize: 13, borderRadius: '2px 0 0 2px', borderRight: 'none' }}
            />
            <button
              onClick={handleSearchSubmit}
              className="flex items-center justify-center px-3 text-white text-xs font-medium"
              style={{ background: 'var(--crimson)', height: 36, borderRadius: '0 2px 2px 0', minWidth: 44 }}>
              Go
            </button>
          </div>
          {/* Sort */}
          <div className="relative">
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }} className="input-base pr-8 appearance-none cursor-pointer" style={{ height: 36, fontSize: 12, paddingRight: 28 }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
          </div>
          {/* Filter toggle (mobile) */}
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="md:hidden btn-outline flex items-center gap-2" style={{ height: 36, padding: '0 12px', fontSize: 12 }}>
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters */}
        <aside className="hidden md:block w-56 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
          <Filters />
        </aside>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {filtersOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setFiltersOpen(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white overflow-y-auto p-5 md:hidden">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Filters</h3>
                  <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
                </div>
                <Filters />
                <button onClick={() => setFiltersOpen(false)} className="btn-primary w-full justify-center mt-4">
                  Show {filtered.length} Results
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Products grid */}
        <div className="flex-1">
          {/* Issue 2 fix — skeleton loading state */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🥻</p>
              <p className="text-lg mb-2" style={{ fontFamily: 'var(--font-heading)' }}>No sarees found</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters</p>
              <button onClick={clearAll} className="btn-outline text-sm">Clear Filters</button>
            </div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                <AnimatePresence>
                  {paginated.map(p => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                      <ProductCard product={p} userId={userId} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Issue 5 fix — Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-medium border transition-all disabled:opacity-30"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce((acc: (number | string)[], n, idx, arr) => {
                        if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('...')
                        acc.push(n)
                        return acc
                      }, [])
                      .map((n, i) => (
                        typeof n === 'string' ? (
                          <span key={`dots-${i}`} className="px-2 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>…</span>
                        ) : (
                          <button key={n} onClick={() => { setPage(n as number); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            className="w-9 h-9 text-xs font-medium border transition-all"
                            style={{ borderColor: page === n ? 'var(--crimson)' : 'var(--border)', background: page === n ? 'var(--crimson)' : 'transparent', color: page === n ? 'white' : 'var(--text-primary)' }}>
                            {n}
                          </button>
                        )
                      ))
                    }
                  </div>
                  <button
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-medium border transition-all disabled:opacity-30"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    Next <ChevronRightIcon size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
