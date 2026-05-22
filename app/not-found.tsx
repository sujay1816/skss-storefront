import Link from 'next/link'
import { ArrowRight, Home, Search, ShoppingBag } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: 'var(--ivory)' }}>
      <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>404 — Page Not Found</p>
      <h1 className="font-light mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(3rem, 10vw, 6rem)', color: 'var(--crimson)', lineHeight: 1 }}>
        Lost in the<br /><em>weave?</em>
      </h1>
      <p className="text-sm mb-10 max-w-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        The page you're looking for has moved or doesn't exist. Let us guide you back to something beautiful.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={14} /> Back to Home
        </Link>
        <Link href="/shop" className="btn-outline inline-flex items-center gap-2">
          <ShoppingBag size={14} /> Browse Collection <ArrowRight size={13} />
        </Link>
        <Link href="/shop?q=" className="btn-outline inline-flex items-center gap-2">
          <Search size={14} /> Search Sarees
        </Link>
      </div>
      <div className="mt-16 flex gap-6 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/shop?filter=new" className="hover:underline" style={{ color: 'var(--crimson)' }}>New Arrivals</Link>
        <Link href="/shop?filter=bestsellers" className="hover:underline" style={{ color: 'var(--crimson)' }}>Bestsellers</Link>
        <Link href="/contact" className="hover:underline" style={{ color: 'var(--crimson)' }}>Contact Us</Link>
      </div>
    </div>
  )
}
