'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { getEffectivePrice } from '@/lib/utils'  // FIX #6: import getEffectivePrice
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
  <button onClick={onClick} className="px-3 py-1.5 text-xs border transition-all duration-150"
    style={{ borderColor: active ? 'var(--crimson)' : 'var(--border)', background: active ? 'var(--crimson)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)' }}>
    {label}
  </button>
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
    // FIX #6: use getEffectivePrice() for price range filtering and sorting
    // Previously used originalPrice, so a product on sale for ₹2000 (originally ₹4000)
    // would be excluded from a "Max ₹2500" filter even though the customer pays ₹2000.
    if (priceMin) p = p.filter(x => getEffectivePrice(x) >= Number(priceMin))
    if (priceMax) p = p.filter(x => getEffectivePrice(x) <= Number(priceMax))
    if (onlyNew) p = p.filter(x => x.isNew)
    if (onlyInStock) p = p.filter(x => !x.isOutOfStock)
    switch (sortBy) {
      case 'price_asc': return p.sort((a,b) => getEffectivePrice(a) - getEffectivePrice(b))
      case 'price_desc': return p.sort((a,b) => getEffectivePrice(b) - getEffectivePrice(a))
      case 'rating': return p.sort((a,b) => b.averageRating - a.averageRating)
      case 'discount': return p.sort((a,b) => (b.discountPercent||0) - (a.discountPercent||0))
      default: return p
    }
  }, [products, search, selectedCategory, selectedFabrics, selectedOccasions, priceMin, priceMax, onlyNew, onlyInStock, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeCount = (selectedCategory ? 1 : 0) + selectedFabrics.length + selectedOccasions.length + (priceMin || priceMax ? 1 : 0) + (onlyNew ? 1 : 0) + (onlyInStock ? 1 : 0)
  const clearAll = () => { setSelectedCategory(''); setSelectedFabrics([]); setSelectedOccasions([]); setPriceMin(''); setPriceMax(''); setOnlyNew(false); setOnlyInStock(false); setPage(1) }

  const handleSearchSubmit = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

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
        <div className="space-y-3">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>₹{Number(priceMin || 0).toLocaleString('en-IN')}</span>
            <span>₹{Number(priceMax || 50000).toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range" min={0} max={50000} step={500}
            value={priceMin || 0}
            onChange={e => { setPriceMin(e.target.value === '0' ? '' : e.target.value); setPage(1) }}
            className="price-slider w-full"
          />
          <input
            type="range" min={0} max={50000} step={500}
            value={priceMax || 50000}
            onChange={e => { setPriceMax(e.target.value === '50000' ? '' : e.target.value); setPage(1) }}
            className="price-slider w-full"
          />
          <div className="flex gap-2 mt-1">
            <input type="number" placeholder="Min ₹" value={priceMin}
              onChange={e => { setPriceMin(e.target.value); setPage(1) }}
              className="input-base flex-1" style={{ height: 32, fontSize: 11 }} />
            <input type="number" placeholder="Max ₹" value={priceMax}
              onChange={e => { setPriceMax(e.target.value); setPage(1) }}
              className="input-base flex-1" style={{ height: 32, fontSize: 11 }} />
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

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="section-heading">Our Collection</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border px-3" style={{ borderColor: 'var(--border)', height: 36 }}>
            <Search size={14} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Search sarees..."
              className="text-xs outline-none bg-transparent"
              style={{ width: 160, color: 'var(--text-primary)' }}
            />
            {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}><X size={12} /></button>}
          </div>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}
            className="text-xs border px-2 outline-none" style={{ borderColor: 'var(--border)', height: 36, color: 'var(--text-primary)', background: 'white' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 text-xs border px-3" style={{ borderColor: 'var(--border)', height: 36, color: 'var(--text-primary)' }}>
            <SlidersHorizontal size={14} />
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="hidden lg:block w-56 flex-shrink-0">
              <Filters />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1">
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {search && ` for "${search}"`}
          </p>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>No products found.</p>
              {activeCount > 0 && <button onClick={clearAll} className="text-xs" style={{ color: 'var(--crimson)' }}>Clear filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginated.map(p => <ProductCard key={p.id} product={p} userId={userId} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border disabled:opacity-30" style={{ borderColor: 'var(--border)' }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className="w-8 h-8 text-xs border"
                  style={{ borderColor: page === i + 1 ? 'var(--crimson)' : 'var(--border)', background: page === i + 1 ? 'var(--crimson)' : 'transparent', color: page === i + 1 ? 'white' : 'var(--text-secondary)' }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center border disabled:opacity-30" style={{ borderColor: 'var(--border)' }}>
                <ChevronRightIcon size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
