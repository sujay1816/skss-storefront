'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, ShoppingBag, User, Menu, X, LogOut, Package, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'
import { useRouter } from 'next/navigation'
import type { Category, SiteConfig, UserProfile } from '@/types'
import SearchBar from './SearchBar'
import toast from 'react-hot-toast'

interface NavbarProps { categories: Category[]; config: SiteConfig; user?: UserProfile | null }

export default function Navbar({ categories, config, user: serverUser }: NavbarProps) {
  const [user, setUser] = useState<UserProfile | null>(serverUser || null)
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // FIX: useRef instead of useState for lastScrollY
  // useState caused the scroll useEffect to re-register its listener on every
  // scroll event (lastScrollY was in the deps array), making every scroll
  // remove + re-add the event handler — an expensive cycle
  const lastScrollY = useRef(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const cartCount = useCartStore(s => s.totalItems())
  const wishlistCount = useWishlistStore(s => s.ids.length)
  const { syncFromDb } = useWishlistStore()

  // Client-side auth sync — fixes Google OAuth session detection on navigation
  useEffect(() => {
    const supabase = createClient()

    const loadUser = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles').select('*').eq('id', userId).single()
        if (profile) {
          const u: UserProfile = {
            id: profile.id, email: profile.email,
            fullName: profile.full_name || '',
            phone: profile.phone || null,
            avatarUrl: profile.avatar_url || null,
            role: profile.role, isBlocked: profile.is_blocked,
            whatsappOptedIn: profile.whatsapp_opted_in,
            createdAt: profile.created_at,
          }
          setUser(u)
          syncFromDb(u.id)
        }
      } catch { setUser(null) }
    }

    // FIX #10: use getUser() instead of getSession() for consistency
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUser(user.id)
      else setUser(null)
    })

    // Keep in sync with auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) loadUser(session.user.id)
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setScrolled(currentY > 20)
      if (currentY < 60) { setVisible(true); lastScrollY.current = currentY; return }
      setVisible(currentY < lastScrollY.current)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // empty deps — handler registered once, reads ref value directly

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])



  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'global' })
    setUser(null)
    setProfileOpen(false)
    setMenuOpen(false)
    toast.success('Signed out successfully!')
    router.push('/')
    router.refresh()
  }

  const firstLetter = user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'My Account'

  return (
    <>
      {/* Announcement bar — truncates gracefully on narrow phones */}
      <div
        className="announcement-bar text-center py-2 text-xs font-light text-white"
        style={{ background: 'var(--crimson)', overflow: 'hidden' }}
      >
        <span className="inline-block truncate max-w-full px-3" style={{ letterSpacing: '0.05em' }}>
          Free shipping above ₹{Number(config.free_shipping_above || 1999).toLocaleString('en-IN')}
          <span className="hidden sm:inline"> &nbsp;·&nbsp; {config.brand_tagline}</span>
        </span>
      </div>

      <motion.header
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-50 bg-white border-b transition-shadow duration-300"
        style={{ borderColor: 'var(--border)', boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none' }}>
        <div className="page-container">
          <div className="flex items-center justify-between h-14 md:h-16 gap-2 md:gap-4">
            {/* Hamburger — shown on mobile AND landscape phones */}
            <button
              className="landscape-show-menu md:hidden flex items-center justify-center w-10 h-10 flex-shrink-0"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <Menu size={22} style={{ color: 'var(--text-primary)' }} />
            </button>

            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
              <Image
                src={config.logo_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%238B1A2B'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-family='serif'%3ES%3C/text%3E%3C/svg%3E"}
                alt={config.brand_name || 'Our Store'}
                width={36} height={36} sizes="36px" className="object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight truncate navbar-brand-name"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)', maxWidth: '160px' }}>
                  {config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'}
                </p>
                <p className="text-xs tracking-widest hidden sm:block landscape-hide navbar-brand-subtitle"
                  style={{ color: 'var(--gold)', letterSpacing: '0.15em' }}>
                  {config.brand_subtitle || 'SILKS & SAREES'}
                </p>
              </div>
            </Link>

            {/* Desktop category nav — hidden on landscape phones (they use hamburger) */}
            <nav className="hidden md:flex landscape-hide-nav items-center gap-0 flex-1 justify-center overflow-hidden">
              {categories.map(cat => (
                <Link key={cat.id} href={`/shop/${cat.slug}`}
                  className="px-3 py-2 text-xs tracking-widest uppercase transition-all duration-200 relative group whitespace-nowrap flex items-center gap-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onClick={e => {
                    const el = e.currentTarget
                    el.style.color = 'var(--crimson)'
                    const dot = document.createElement('span')
                    dot.style.cssText = 'display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--crimson);animation:pulse 0.6s ease infinite;margin-left:4px'
                    el.appendChild(dot)
                    setTimeout(() => dot.remove(), 2000)
                  }}>
                  {cat.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ background: 'var(--gold)' }} />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="flex items-center justify-center w-10 h-10" aria-label={searchOpen ? "Close search" : "Open search"} aria-expanded={searchOpen} style={{ color: 'var(--text-primary)' }}>
                <Search size={18} />
              </button>
              <Link href="/wishlist" className="relative flex items-center justify-center w-10 h-10" aria-label="Wishlist">
                <Heart size={18} style={{ color: 'var(--text-primary)' }} />
                {wishlistCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-semibold" style={{ background: 'var(--crimson)', fontSize: '9px' }}>{wishlistCount}</span>}
              </Link>
              <Link href="/cart" className="relative flex items-center justify-center w-10 h-10" aria-label="Shopping cart">
                <ShoppingBag size={18} style={{ color: 'var(--text-primary)' }} />
                {cartCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-semibold" style={{ background: 'var(--crimson)', fontSize: '9px' }}>{cartCount}</span>}
              </Link>

              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setProfileOpen(!profileOpen)} aria-label={user ? `${user.fullName || "Account"} menu` : "Account menu"} aria-expanded={profileOpen}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                  style={{ background: profileOpen ? 'var(--cream)' : 'transparent' }}>
                  {user ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, var(--crimson) 0%, #6B1220 100%)' }}>
                      {firstLetter}
                    </div>
                  ) : (
                    <User size={18} style={{ color: 'var(--text-primary)' }} />
                  )}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white border shadow-2xl z-50 overflow-hidden"
                      style={{ borderColor: 'var(--border)', borderRadius: 12, width: 240 }}>
                      {user ? (
                        <>
                          <div className="px-4 py-4" style={{ background: 'linear-gradient(135deg, var(--crimson) 0%, #6B1220 100%)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}>
                                {firstLetter}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{user.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="py-1.5">
                            {[
                              { href: '/profile', icon: <User size={15} />, label: 'My Profile', sub: 'Edit your details' },
                              { href: '/orders', icon: <Package size={15} />, label: 'My Orders', sub: 'Track & manage orders' },
                              { href: '/wishlist', icon: <Heart size={15} />, label: 'My Wishlist', sub: wishlistCount > 0 ? `${wishlistCount} saved items` : 'Saved items', badge: wishlistCount > 0 ? wishlistCount : null },
                              { href: '/cart', icon: <ShoppingBag size={15} />, label: 'My Cart', sub: cartCount > 0 ? `${cartCount} items` : 'View cart', badge: cartCount > 0 ? cartCount : null },
                            ].map(item => (
                              <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <span style={{ color: 'var(--crimson)' }}>{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{item.label}</p>
                                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.sub}</p>
                                </div>
                                {item.badge ? (
                                  <span className="text-xs font-bold text-white w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--crimson)', fontSize: '9px' }}>{item.badge}</span>
                                ) : (
                                  <ChevronRight size={13} style={{ color: 'var(--border)' }} />
                                )}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t p-2" style={{ borderColor: 'var(--border)' }}>
                            <button type="button" onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                              style={{ color: '#DC2626' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <LogOut size={15} /><span>Sign Out</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-4" style={{ background: 'var(--cream)' }}>
                            <p className="font-semibold text-sm mb-0.5" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Welcome!</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sign in to access your account</p>
                          </div>
                          <div className="p-3 space-y-2">
                            <Link href="/login" onClick={() => setProfileOpen(false)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white transition-all"
                              style={{ background: 'var(--crimson)', borderRadius: 8, display: 'flex' }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                              <User size={14} /> Sign In
                            </Link>
                            <Link href="/signup" onClick={() => setProfileOpen(false)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
                              style={{ border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', display: 'flex' }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--crimson)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                              Create Account
                            </Link>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t" style={{ borderColor: 'var(--border)', background: 'var(--ivory)' }}>
              <div className="page-container py-4">
                <SearchBar onClose={() => setSearchOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 flex flex-col bg-white">
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                <div className="flex items-center gap-3">
                  <Image src={config.logo_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='18' fill='%238B1A2B'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-family='serif'%3ES%3C/text%3E%3C/svg%3E"} alt={config.brand_name || "SKSS"} width={36} height={36} sizes="36px" className="object-contain" />
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--crimson)' }}>{config.brand_name || process.env.NEXT_PUBLIC_BRAND_NAME || 'Our Store'}</p>
                    <p className="text-xs tracking-widest" style={{ color: 'var(--gold)', fontSize: '9px' }}>{config.brand_subtitle || 'SILKS & SAREES'}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={22} style={{ color: 'var(--text-primary)' }} /></button>
              </div>

              {user && (
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, var(--crimson) 0%, #6B1220 100%)' }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}>
                    {firstLetter}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto">
                {user ? (
                  <div className="py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <p className="px-5 py-2 text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>My Account</p>
                    {[
                      { href: '/profile', icon: <User size={16} />, label: 'My Profile' },
                      { href: '/orders', icon: <Package size={16} />, label: 'My Orders' },
                      { href: '/wishlist', icon: <Heart size={16} />, label: `My Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}` },
                      { href: '/cart', icon: <ShoppingBag size={16} />, label: `My Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-sm transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span style={{ color: 'var(--crimson)' }}>{item.icon}</span>
                        {item.label}
                        <ChevronRight size={14} className="ml-auto" style={{ color: 'var(--border)' }} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex gap-2">
                      <Link href="/login" onClick={() => setMenuOpen(false)}
                        className="flex-1 py-2.5 text-center text-xs font-medium text-white rounded-lg"
                        style={{ background: 'var(--crimson)' }}>Sign In</Link>
                      <Link href="/signup" onClick={() => setMenuOpen(false)}
                        className="flex-1 py-2.5 text-center text-xs font-medium rounded-lg"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-primary)' }}>Create Account</Link>
                    </div>
                  </div>
                )}
                <div className="py-2">
                  <p className="px-5 py-2 text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>Shop by Category</p>
                  {categories.map(cat => (
                    <Link key={cat.id} href={`/shop/${cat.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-5 py-3 text-sm border-b transition-colors active:bg-[var(--cream)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onTouchStart={e => (e.currentTarget.style.background = 'var(--cream)')}
                      onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}>
                      {cat.name} <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                    </Link>
                  ))}
                </div>
              </nav>

              {user && (
                <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button type="button" onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-lg transition-all"
                    style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
