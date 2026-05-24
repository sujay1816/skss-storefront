'use client'
import { useEffect } from 'react'

/**
 * FontLoader — swaps the font stylesheet from media="print" to media="all"
 * after the page loads. This is the correct client-side half of the
 * non-blocking font loading pattern used in layout.tsx.
 *
 * Without this component the stylesheet stays as media="print" forever and
 * fonts never visually apply for users who don't have them in their browser cache.
 */
export default function FontLoader() {
  useEffect(() => {
    // Find all Google Fonts stylesheets loaded as media="print" and swap to "all"
    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"][media="print"][href*="fonts.googleapis.com"]'
    )
    links.forEach(link => {
      if (link.media !== 'all') {
        link.media = 'all'
      }
    })
  }, [])

  return null
}
