import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Crumb { label: string; href?: string }

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-nav">
      <ol className="flex items-center flex-wrap gap-1" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  size={11}
                  aria-hidden="true"
                  style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
                />
              )}
              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="breadcrumb-current"
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: isLast ? 500 : 400,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="breadcrumb-link"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--crimson)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}>
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
