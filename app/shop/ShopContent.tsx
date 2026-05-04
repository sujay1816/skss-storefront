'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { Product, Category, SiteConfig } from '@/types'
import { formatPrice } from '@/lib/utils'

const FABRICS = ['Silk','Cotton','Georgette','Chiffon','Linen','Organza','Net','Crepe','Tussar','Chanderi']
const OCCASIONS = ['Wedding','Festive','Casual','Office','Party','Religious','Daily Wear']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'discount', label: 'Best Discount' },
]

export default function ShopContent({ products, categories, config, userId, initialCategory, initialSearch }: {
  products: Product[]; categories: Category[]; config: SiteConfig; userId?: string; initialCategory?: string; initialSearch?: string
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState(initialSearch || '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '')
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
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

  const activeCount = (selectedCategory ? 1 : 0) + selectedFabrics.length + selectedOccasions.length + (priceMin || priceMax ? 1 : 0) + (onlyNew ? 1 : 0) + (onlyInStock ? 1 : 0)
  const clearAll = () => { setSelectedCategory(''); setSelectedFabrics([]); setSelectedOccasions([]); setPriceMin(''); setPriceMax(''); setOnlyNew(false); setOnlyInStock(false) }

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
          <FilterChip label="All" active={!selectedCategory} onClick={() => setSelectedCategory('')} />
          {categories.map(c => <FilterChip key={c.id} label={c.name} active={selectedCategory === c.slug} onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)} />)}
        </div>
      </FilterSection>
      <FilterSection title="Fabric">
        <div className="flex flex-wrap gap-2">{FABRICS.map(f => <FilterChip key={f} label={f} active={selectedFabrics.includes(f)} onClick={() => toggleFilter(selectedFabrics, f, setSelectedFabrics)} />)}</div>
      </FilterSection>
      <FilterSection title="Occasion">
        <div className="flex flex-wrap gap-2">{OCCASIONS.map(o => <FilterChip key={o} label={o} active={selectedOccasions.includes(o)} onClick={() => toggleFilter(selectedOccasions, o, setSelectedOccasions)} />)}</div>
      </FilterSection>
      <FilterSection title="Price Range">
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min ₹" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="input-base flex-1" style={{ height: 36, fontSize: 12 }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>to</span>
          <input type="number" placeholder="Max ₹" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="input-base flex-1" style={{ height: 36, fontSize: 12 }} />
        </div>
      </FilterSection>
      <FilterSection title="Quick Filters">
        <div className="space-y-2">
          {[['New Arrivals', onlyNew, () => setOnlyNew(!onlyNew)], ['In Stock Only', onlyInStock, () => setOnlyInStock(!onlyInStock)]].map(([label, checked, onChange]: any) => (
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
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{filtered.length} sarees found</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-base pl-9" style={{ height: 36, width: 180, fontSize: 13 }} />
          </div>
          {/* Sort */}
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-base pr-8 appearance-none cursor-pointer" style={{ height: 36, fontSize: 12, paddingRight: 28 }}>
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
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Products grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🥻</p>
              <p className="text-lg mb-2" style={{ fontFamily: 'var(--font-heading)' }}>No sarees found</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters</p>
              <button onClick={clearAll} className="btn-outline text-sm">Clear Filters</button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              <AnimatePresence>
                {filtered.map(p => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                    <ProductCard product={p} userId={userId} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
