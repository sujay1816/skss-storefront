'use client'
import { useState, useCallback, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// FIX: framer-motion removed from filter animations — replaced with CSS
import { SlidersHorizontal, X, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { getEffectivePrice } from '@/lib/utils'
import type { Product, Category, SiteConfig } from '@/types'

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

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="pb-5 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
    <h4 className="filter-section-title">{title}</h4>
    {children}
  </div>
)

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="px-3 py-1.5 text-xs border transition-all duration-150"
    style={{ borderColor: active ? 'var(--crimson)' : 'var(--border)', background: active ? 'var(--crimson)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)' }}>
    {label}
  </button>
)

// FiltersContent defined OUTSIDE ShopContent so it isn't recreated on every
// filter state change. Defining it inside caused the entire filter UI to
// unmount/remount on every state update (category, fabric, price, etc).
interface FiltersProps {
  activeCount: number
  categories: Category[]
  fabrics: string[]
  selectedCategory: string
  selectedFabrics: string[]
  selectedOccasions: string[]
  priceMin: string
  priceMax: string
  onlyNew: boolean
  onlyInStock: boolean
  setSelectedCategory: (v: string) => void
  setSelectedFabrics: (v: string[]) => void
  setSelectedOccasions: (v: string[]) => void
  setPriceMin: (v: string) => void
  setPriceMax: (v: string) => void
  setOnlyNew: (v: boolean) => void
  setOnlyInStock: (v: boolean) => void
  setPage: (v: number) => void
  clearAll: () => void
  toggleFilter: (arr: string[], val: string, set: (v: string[]) => void, key: string) => void
}
function FiltersContent({ activeCount, categories, fabrics, selectedCategory, selectedFabrics,
  selectedOccasions, priceMin, priceMax, onlyNew, onlyInStock,
  setSelectedCategory, setSelectedFabrics, setSelectedOccasions,
  setPriceMin, setPriceMax, setOnlyNew, setOnlyInStock, setPage, clearAll, toggleFilter
}: FiltersProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Filters {activeCount > 0 && `(${activeCount})`}</h3>
        {activeCount > 0 && <button type="button" onClick={clearAll} className="text-xs" style={{ color: 'var(--crimson)' }}>Clear All</button>}
      </div>
      <FilterSection title="Category">
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All" active={!selectedCategory} onClick={() => { setSelectedCategory(''); setPage(1) }} />
          {categories.map(c => <FilterChip key={c.id} label={c.name} active={selectedCategory === c.slug} onClick={() => { setSelectedCategory(selectedCategory === c.slug ? '' : c.slug); setPage(1) }} />)}
        </div>
      </FilterSection>
      <FilterSection title="Fabric">
        <div className="flex flex-wrap gap-2">{fabrics.map(f => <FilterChip key={f} label={f} active={selectedFabrics.includes(f)} onClick={() => toggleFilter(selectedFabrics, f, setSelectedFabrics, 'fabrics')} />)}</div>
      </FilterSection>
      <FilterSection title="Occasion">
        <div className="flex flex-wrap gap-2">{OCCASIONS.map(o => <FilterChip key={o} label={o} active={selectedOccasions.includes(o)} onClick={() => toggleFilter(selectedOccasions, o, setSelectedOccasions, 'occasions')} />)}</div>
      </FilterSection>
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>₹{Number(priceMin || 0).toLocaleString('en-IN')}</span>
            <span>₹{Number(priceMax || 50000).toLocaleString('en-IN')}</span>
          </div>
          <input type="range" min={0} max={50000} step={500} value={priceMin || 0}
            onChange={e => { const v = Number(e.target.value); if (v <= Number(priceMax || 50000) - 500) { setPriceMin(v === 0 ? '' : String(v)); setPage(1) } }}
            className="price-slider w-full" />
          <input type="range" min={0} max={50000} step={500} value={priceMax || 50000}
            onChange={e => { const v = Number(e.target.value); if (v >= Number(priceMin || 0) + 500) { setPriceMax(v === 50000 ? '' : String(v)); setPage(1) } }}
            className="price-slider w-full" />
          <div className="flex gap-2 mt-1">
            <input type="number" placeholder="Min ₹" value={priceMin} onChange={e => { setPriceMin(e.target.value); setPage(1) }} className="input-base flex-1" style={{ height: 32, fontSize: 11 }} />
            <input type="number" placeholder="Max ₹" value={priceMax} onChange={e => { setPriceMax(e.target.value); setPage(1) }} className="input-base flex-1" style={{ height: 32, fontSize: 11 }} />
          </div>
        </div>
      </FilterSection>
      <FilterSection title="Quick Filters">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={onlyNew} onChange={e => { setOnlyNew(e.target.checked); setPage(1) }} style={{ accentColor: 'var(--crimson)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>New Arrivals</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={onlyInStock} onChange={e => { setOnlyInStock(e.target.checked); setPage(1) }} style={{ accentColor: 'var(--crimson)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>In Stock Only</span>
          </label>
        </div>
      </FilterSection>
    </div>
  )
}

interface InitialFilters {
  fabrics: string[]; occasions: string[]; priceMin: string; priceMax: string
  onlyNew: boolean; sortBy: string
}

export default function ShopContent({ products, categories, config, userId, initialCategory, initialSearch,
  isLoading, fabrics: fabricsProp, totalProducts = 0, currentPage = 1, pageSize = 16, initialFilters
}: {
  products: Product[]; categories: Category[]; config: SiteConfig; userId?: string
  initialCategory?: string; initialSearch?: string; isLoading?: boolean; fabrics?: string[]
  totalProducts?: number; currentPage?: number; pageSize?: number; initialFilters?: InitialFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const fabrics = fabricsProp && fabricsProp.length > 0 ? fabricsProp : DEFAULT_FABRICS
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(initialSearch || '')
  const [search, setSearch] = useState(initialSearch || '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '')
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(initialFilters?.fabrics || [])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(initialFilters?.occasions || [])
  const [priceMin, setPriceMin] = useState(initialFilters?.priceMin || '')
  const [priceMax, setPriceMax] = useState(initialFilters?.priceMax || '')
  const [onlyNew, setOnlyNew] = useState(initialFilters?.onlyNew || false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'newest')

  // SCALABILITY: navigate to new URL when server-side filters change.
  // Each unique URL is cached by ISR — zero DB queries for cached combos.
  const applyServerFilters = useCallback((overrides: Record<string, any> = {}) => {
    const params = new URLSearchParams()
    const cat  = overrides.category  !== undefined ? overrides.category  : selectedCategory
    const fabs = overrides.fabrics   !== undefined ? overrides.fabrics   : selectedFabrics
    const occ  = overrides.occasions !== undefined ? overrides.occasions : selectedOccasions
    const pMin = overrides.priceMin  !== undefined ? overrides.priceMin  : priceMin
    const pMax = overrides.priceMax  !== undefined ? overrides.priceMax  : priceMax
    const nw   = overrides.onlyNew   !== undefined ? overrides.onlyNew   : onlyNew
    const sort = overrides.sortBy    !== undefined ? overrides.sortBy    : sortBy
    const srch = overrides.search    !== undefined ? overrides.search    : search

    // Use clean /shop/[category] URL for SEO — no query param
    const basePath = cat ? `/shop/${cat}` : '/shop'

    if (fabs?.length) params.set('fabrics', fabs.join(','))
    if (occ?.length)  params.set('occasions', occ.join(','))
    if (pMin)         params.set('priceMin', pMin)
    if (pMax)         params.set('priceMax', pMax)
    if (nw)           params.set('filter', 'new')
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (srch)         params.set('q', srch)
    const qs = params.toString()
    const url = qs ? `${basePath}?${qs}` : basePath
    startTransition(() => router.push(url, { scroll: false }))
  }, [selectedCategory, selectedFabrics, selectedOccasions, priceMin, priceMax, onlyNew, sortBy, search, router])

  const setSelectedCategoryAndNav = (v: string) => { setSelectedCategory(v); applyServerFilters({ category: v }) }
  const setSortByAndNav = (v: string) => { setSortBy(v); applyServerFilters({ sortBy: v }) }

  // Local-only filter (in-stock filtering stays client-side — it's per-variant)
  const filtered = onlyInStock ? products.filter(p => !p.isOutOfStock) : products
  const paginated = filtered  // products already paginated by server

  const totalPages = Math.ceil(totalProducts / pageSize)
  const page = currentPage

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void, key: string) => {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
    set(next)
    applyServerFilters({ [key]: next })
  }

  const activeCount = (selectedCategory ? 1 : 0) + selectedFabrics.length + selectedOccasions.length +
    (priceMin || priceMax ? 1 : 0) + (onlyNew ? 1 : 0) + (onlyInStock ? 1 : 0)

  const clearAll = () => {
    setSelectedCategory(''); setSelectedFabrics([]); setSelectedOccasions([])
    setPriceMin(''); setPriceMax(''); setOnlyNew(false); setOnlyInStock(false)
    startTransition(() => router.push('/shop', { scroll: false }))
  }

  const setPage = (p: number) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    params.set('page', String(p))
    const base = selectedCategory ? `/shop/${selectedCategory}` : '/shop'
    startTransition(() => router.push(`${base}?${params.toString()}`, { scroll: true }))
  }

  const handleSearchSubmit = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  // FIX #7: smart pagination — show at most 5 page buttons with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages]
    if (page >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  // FiltersContent is defined above as a module-level component

  return (
    <div className="page-container py-8">
      {/* FIX #4: responsive toolbar — stacks on mobile */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h1 className="section-heading">Our Collection</h1>
          {/* Mobile: sort + filter buttons only */}
          <div className="flex items-center gap-2 lg:hidden shop-mobile-toolbar">
            <select value={sortBy} onChange={e => setSortByAndNav(e.target.value)}
              className="text-xs border px-2 outline-none flex-1 min-w-0" style={{ borderColor: 'var(--border)', height: 40, color: 'var(--text-primary)', background: 'white' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button type="button" onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 text-xs border px-3 font-medium"
              style={{ borderColor: activeCount > 0 ? 'var(--crimson)' : 'var(--border)', height: 40, color: activeCount > 0 ? 'var(--crimson)' : 'var(--text-primary)', background: activeCount > 0 ? 'var(--cream)' : 'white' }}>
              <SlidersHorizontal size={14} />
              Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
          </div>
        </div>
        {/* Mobile: full-width search bar */}
        <div className="flex items-center gap-2 border px-3 lg:hidden" style={{ borderColor: 'var(--border)', height: 40 }}>
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="Search sarees..." className="text-sm outline-none bg-transparent flex-1"
            style={{ color: 'var(--text-primary)' }} />
          {searchInput && <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}><X size={14} /></button>}
        </div>
        {/* Desktop: original inline toolbar */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 border px-3" style={{ borderColor: 'var(--border)', height: 36 }}>
            <Search size={14} style={{ color: 'var(--text-secondary)' }} />
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Search sarees..." className="text-xs outline-none bg-transparent"
              style={{ width: 160, color: 'var(--text-primary)' }} />
            {searchInput && <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}><X size={12} /></button>}
          </div>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}
            className="text-xs border px-2 outline-none" style={{ borderColor: 'var(--border)', height: 36, color: 'var(--text-primary)', background: 'white' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 text-xs border px-3"
            style={{ borderColor: 'var(--border)', height: 36, color: 'var(--text-primary)' }}>
            <SlidersHorizontal size={14} />
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>

      {/* Desktop sidebar layout */}
      <div className="flex gap-8">
        {filtersOpen && (
            <div className="hidden lg:block w-56 flex-shrink-0 filter-sidebar-css">
              <FiltersContent activeCount={activeCount} categories={categories} fabrics={fabrics}
              selectedCategory={selectedCategory} selectedFabrics={selectedFabrics}
              selectedOccasions={selectedOccasions} priceMin={priceMin} priceMax={priceMax}
              onlyNew={onlyNew} onlyInStock={onlyInStock}
              setSelectedCategory={setSelectedCategoryAndNav} setSelectedFabrics={setSelectedFabrics}
              setSelectedOccasions={setSelectedOccasions} setPriceMin={setPriceMin}
              setPriceMax={setPriceMax} setOnlyNew={setOnlyNew} setOnlyInStock={setOnlyInStock}
              setPage={setPage} clearAll={clearAll} toggleFilter={toggleFilter} />
            </div>
          )}

        <div className="flex-1">
          <p className="text-xs mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            {isPending && (
              <span className="inline-block w-3 h-3 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--crimson)', borderTopColor: 'transparent' }} />
            )}
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {search && ` for "${search}"`}
          </p>
          {(isLoading || isPending) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: pageSize || 16 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <div style={{ fontSize: 56, marginBottom: 16 }}>🛍️</div>
              <h3 className="text-xl font-light mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                No sarees found
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {activeCount > 0
                  ? `Your current filters don't match any products. Try removing some filters.`
                  : `No products available right now. Check back soon!`}
              </p>
              {activeCount > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button type="button" onClick={clearAll} className="btn-primary">
                    Clear All Filters
                  </button>
                  <button type="button" onClick={() => setSelectedCategory('')} className="btn-outline">
                    Browse All Categories
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 product-grid">
              {paginated.map((p, i) => <ProductCard key={p.id} product={p} userId={userId} index={i} />)}
            </div>
          )}

          {/* FIX #7: smart pagination with ellipsis — no overflow on mobile */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-10">
              <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center border disabled:opacity-30"
                style={{ borderColor: 'var(--border)' }}>
                <ChevronLeft size={14} />
              </button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-xs"
                    style={{ color: 'var(--text-secondary)' }}>…</span>
                ) : (
                  <button type="button" key={p} onClick={() => setPage(Number(p))}
                    className="w-9 h-9 text-xs border font-medium"
                    style={{
                      borderColor: page === p ? 'var(--crimson)' : 'var(--border)',
                      background: page === p ? 'var(--crimson)' : 'transparent',
                      color: page === p ? 'white' : 'var(--text-secondary)',
                    }}>
                    {p}
                  </button>
                )
              )}
              <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center border disabled:opacity-30"
                style={{ borderColor: 'var(--border)' }}>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FIX #1: mobile filter bottom drawer */}
      <>
        {filtersOpen && (
          <>
            {/* Backdrop — CSS fade */}
            <div
              className="fixed inset-0 z-40 lg:hidden filter-backdrop-css"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setFiltersOpen(false)}
            />
            {/* Bottom sheet — CSS slide-up */}
            <div
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white filter-drawer-css"
              style={{ borderRadius: '16px 16px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              {/* Handle */}
              <div className="flex items-center justify-center pt-3 pb-2 flex-shrink-0">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Filters {activeCount > 0 && `(${activeCount})`}
                </span>
                <button type="button" onClick={() => setFiltersOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 pt-4">
                <FiltersContent activeCount={activeCount} categories={categories} fabrics={fabrics}
              selectedCategory={selectedCategory} selectedFabrics={selectedFabrics}
              selectedOccasions={selectedOccasions} priceMin={priceMin} priceMax={priceMax}
              onlyNew={onlyNew} onlyInStock={onlyInStock}
              setSelectedCategory={setSelectedCategory} setSelectedFabrics={setSelectedFabrics}
              setSelectedOccasions={setSelectedOccasions} setPriceMin={setPriceMin}
              setPriceMax={setPriceMax} setOnlyNew={setOnlyNew} setOnlyInStock={setOnlyInStock}
              setPage={setPage} clearAll={clearAll} toggleFilter={toggleFilter} />
              </div>
              {/* Apply button */}
              <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex gap-3">
                  {activeCount > 0 && (
                    <button type="button" onClick={() => { clearAll(); setFiltersOpen(false) }}
                      className="btn-outline flex-1 justify-center" style={{ height: 48 }}>
                      Clear All
                    </button>
                  )}
                  <button type="button" onClick={() => setFiltersOpen(false)}
                    className="btn-primary flex-1 justify-center" style={{ height: 48 }}>
                    Show {filtered.length} Results
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    </div>
  )
}
