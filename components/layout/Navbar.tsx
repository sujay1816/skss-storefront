'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { useRouter } from 'next/navigation'
import type { Category, SiteConfig, UserProfile } from '@/types'
import toast from 'react-hot-toast'

interface NavbarProps { categories: Category[]; config: SiteConfig; user?: UserProfile | null }

export default function Navbar({ categories, config, user }: NavbarProps) {
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastScrollY, setLastScrollY] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const cartCount = useCartStore(s => s.totalItems())
  const wishlistCount = useWishlistStore(s => s.ids.length)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setScrolled(currentY > 20)
      if (currentY < 60) { setVisible(true); setLastScrollY(currentY); return }
      setVisible(currentY < lastScrollY)
      setLastScrollY(currentY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => { if (searchOpen) searchRef.current?.focus() }, [searchOpen])
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menuOpen])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) { router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery('') }
    if (e.key === 'Escape') setSearchOpen(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
    toast.success('Signed out successfully')
    setProfileOpen(false)
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="text-center py-2 text-xs tracking-widest font-light text-white" style={{ background: 'var(--crimson)' }}>
        Free shipping on orders above ₹{Number(config.free_shipping_above).toLocaleString('en-IN')} &nbsp;·&nbsp; {config.brand_tagline}
      </div>

      {/* Main navbar */}
      <motion.header
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-50 bg-white border-b transition-shadow duration-300"
        style={{ borderColor: 'var(--border)', boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none' }}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16 gap-4">
            <button className="md:hidden flex items-center justify-center w-10 h-10" onClick={() => setMenuOpen(true)}>
              <Menu size={22} style={{ color: 'var(--text-primary)' }} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image src="/images/logo.png" alt="Sai Krishna Silks and Sarees" width={44} height={44} className="object-contain" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)' }}>Sai Krishna</p>
                <p className="text-xs tracking-widest" style={{ color: 'var(--gold)', letterSpacing: '0.15em' }}>SILKS & SAREES</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0 flex-1 justify-center">
              {categories.map(cat => (
                <Link key={cat.id} href={`/shop?category=${cat.slug}`}
                  className="px-4 py-2 text-xs tracking-widest uppercase transition-all duration-200 relative group"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                  {cat.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ background: 'var(--gold)' }} />
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1">
              <button onClick={() => setSearchOpen(!searchOpen)} className="flex items-center justify-center w-10 h-10 transition-colors" style={{ color: 'var(--text-primary)' }}>
                <Search size={18} />
              </button>
              <Link href="/wishlist" className="relative flex items-center justify-center w-10 h-10">
                <Heart size={18} style={{ color: 'var(--text-primary)' }} />
                {wishlistCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-semibold" style={{ background: 'var(--crimson)', fontSize: '9px' }}>{wishlistCount}</span>}
              </Link>
              <Link href="/cart" className="relative flex items-center justify-center w-10 h-10">
                <ShoppingBag size={18} style={{ color: 'var(--text-primary)' }} />
                {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-semibold" style={{ background: 'var(--crimson)', fontSize: '9px' }}>{cartCount}</span>}
              </Link>
              {/* Profile dropdown */}
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center justify-center w-10 h-10">
                  <User size={18} style={{ color: 'var(--text-primary)' }} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-white border shadow-lg z-50"
                      style={{ borderColor: 'var(--border)' }}>
                      {user ? (
                        <>
                          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.fullName || 'My Account'}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                          </div>
                          <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors" style={{ color: 'var(--text-primary)' }}><User size={14} /> My Profile</Link>
                          <Link href="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors" style={{ color: 'var(--text-primary)' }}><ShoppingBag size={14} /> My Orders</Link>
                          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors border-t" style={{ color: 'var(--crimson)', borderColor: 'var(--border)' }}><LogOut size={14} /> Sign Out</button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors" style={{ color: 'var(--text-primary)' }}>Sign In</Link>
                          <Link href="/signup" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors border-t" style={{ color: 'var(--crimson)', borderColor: 'var(--border)' }}>Create Account</Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t" style={{ borderColor: 'var(--border)', background: 'var(--ivory)' }}>
              <div className="page-container py-4">
                <div className="relative max-w-2xl mx-auto">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                  <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search sarees by name, fabric, occasion..." className="input-base pl-10" onKeyDown={handleSearch} />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X size={14} style={{ color: 'var(--text-secondary)' }} /></button>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 flex flex-col bg-white">
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                <div className="flex items-center gap-3">
                  <Image src="/images/logo.png" alt="SKSS" width={36} height={36} className="object-contain" />
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)' }}>Sai Krishna</p>
                    <p className="text-xs tracking-widest" style={{ color: 'var(--gold)', fontSize: '9px' }}>SILKS & SAREES</p>
                  </div>
                </div>
                <button onClick={() => setMenuOpen(false)}><X size={22} style={{ color: 'var(--text-primary)' }} /></button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2">
                <p className="px-5 py-2 text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Shop by Category</p>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/shop?category=${cat.slug}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-5 py-3.5 border-b text-sm"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    {cat.name} <ChevronDown size={14} className="-rotate-90" style={{ color: 'var(--text-secondary)' }} />
                  </Link>
                ))}
                <div className="mt-4 px-5 space-y-1">
                  {user ? (
                    <>
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 py-3 text-sm" style={{ color: 'var(--text-primary)' }}><User size={16} /> My Profile</Link>
                      <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 py-3 text-sm" style={{ color: 'var(--text-primary)' }}><ShoppingBag size={16} /> My Orders</Link>
                      <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 py-3 text-sm" style={{ color: 'var(--text-primary)' }}><Heart size={16} /> Wishlist</Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 py-3 text-sm w-full" style={{ color: 'var(--crimson)' }}><LogOut size={16} /> Sign Out</button>
                    </>
                  ) : (
                    <div className="flex gap-3 pt-2">
                      <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 justify-center" style={{ fontSize: '11px', padding: '10px 16px' }}>Sign In</Link>
                      <Link href="/signup" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 justify-center" style={{ fontSize: '11px', padding: '10px 16px' }}>Sign Up</Link>
                    </div>
                  )}
                </div>
              </nav>
              <div className="p-5 border-t" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>WhatsApp: {config.whatsapp_number}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
