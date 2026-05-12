'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function PageProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const barRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    // Show bar immediately on route change
    bar.style.width = '30%'
    bar.style.opacity = '1'
    bar.classList.add('loading')
    bar.classList.remove('complete')

    // Simulate progress
    timerRef.current = setTimeout(() => {
      bar.style.width = '70%'
    }, 100)

    const done = setTimeout(() => {
      bar.style.width = '100%'
      bar.classList.remove('loading')
      bar.classList.add('complete')
      setTimeout(() => {
        bar.style.width = '0%'
        bar.style.opacity = '0'
        bar.classList.remove('complete')
      }, 400)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearTimeout(done)
    }
  }, [pathname, searchParams])

  return <div id="page-progress" ref={barRef} style={{ width: 0, opacity: 0 }} />
}
