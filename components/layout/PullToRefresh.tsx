'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

// Pull-to-refresh component
// ─────────────────────────────────────────────────────────────────────────────
// How it works:
//   1. User touches the screen at the very top of the page (scrollY === 0)
//   2. They drag down — a spinner indicator pulls down with their finger
//   3. At 80px threshold the spinner turns gold and "locks" — release triggers reload
//   4. On release: spinner spins fully, page reloads after 600ms
//
// Uses native touch events (not Framer Motion) — smooth on all Android devices.
// Only active on mobile (touch devices) — desktop has browser pull-to-refresh built in.

const THRESHOLD = 80   // px of drag needed to trigger refresh
const MAX_PULL  = 110  // px max drag (rubber-band stops here)

interface Props {
  onRefresh?: () => void   // custom refresh handler (default: window.location.reload)
}

export default function PullToRefresh({ onRefresh }: Props) {
  const [pullY, setPullY] = useState(0)           // current pull distance 0–MAX_PULL
  const [state, setState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle')
  const startYRef = useRef<number | null>(null)
  const pullingRef = useRef(false)

  const doRefresh = useCallback(() => {
    setState('refreshing')
    setPullY(48)   // hold spinner at 48px while refreshing
    setTimeout(() => {
      if (onRefresh) {
        onRefresh()
      } else {
        window.location.reload()
      }
    }, 600)
  }, [onRefresh])

  useEffect(() => {
    // Only enable on touch devices
    if (!('ontouchstart' in window)) return

    const onTouchStart = (e: TouchEvent) => {
      // Only start pull if at top of page
      if (window.scrollY > 2) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return
      if (window.scrollY > 2) { startYRef.current = null; return }

      const dy = e.touches[0].clientY - startYRef.current
      if (dy <= 0) { startYRef.current = null; return }

      // Rubber-band: drag slows as it approaches MAX_PULL
      const pull = Math.min(dy * 0.45, MAX_PULL)
      pullingRef.current = true
      setPullY(pull)
      setState(pull >= THRESHOLD ? 'ready' : 'pulling')

      // Prevent default scroll when pulling — stops page from scrolling up
      if (dy > 8) e.preventDefault()
    }

    const onTouchEnd = () => {
      if (!pullingRef.current) return
      const currentState = pullY >= THRESHOLD ? 'ready' : 'pulling'
      if (currentState === 'ready' || state === 'ready') {
        doRefresh()
      } else {
        // Snap back
        setPullY(0)
        setState('idle')
      }
      startYRef.current = null
      pullingRef.current = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullY, state, doRefresh])

  // Completely hidden when idle and fully snapped back
  if (state === 'idle' && pullY === 0) return null

  const progress = Math.min(pullY / THRESHOLD, 1)          // 0→1
  const isReady  = state === 'ready' || state === 'refreshing'
  const isSpinning = state === 'refreshing'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        // Smooth snap-back when released
        transition: state === 'idle' ? 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
        transform: `translateY(${pullY - 48}px)`,
      }}>
      {/* Indicator circle */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: isReady ? 'var(--crimson)' : 'white',
        border: `2px solid ${isReady ? 'var(--crimson)' : 'var(--border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        transition: 'background 0.2s, border-color 0.2s',
        marginTop: 8,
      }}>
        {isSpinning ? (
          // Spinning loader when refreshing
          <div style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '2.5px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            animation: 'ptr-spin 0.7s linear infinite',
          }} />
        ) : (
          // Arc progress indicator — fills as user pulls
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none"
              stroke={isReady ? 'rgba(255,255,255,0.4)' : 'var(--border)'}
              strokeWidth="2" />
            <circle cx="10" cy="10" r="8" fill="none"
              stroke={isReady ? 'white' : 'var(--crimson)'}
              strokeWidth="2"
              strokeDasharray={`${progress * 50.3} 50.3`}
              strokeLinecap="round"
              transform="rotate(-90 10 10)"
              style={{ transition: 'stroke-dasharray 0.1s' }}
            />
            {/* Down arrow that rotates to up when ready */}
            <path
              d={isReady
                ? "M10 13 L7 9 M10 13 L13 9"   // up chevron (ready)
                : "M10 7 L7 11 M10 7 L13 11"}   // down chevron (pulling)
              stroke={isReady ? 'white' : 'var(--crimson)'}
              strokeWidth="1.8"
              strokeLinecap="round"
              style={{ transition: 'd 0.2s' }}
            />
          </svg>
        )}
      </div>

      {/* Label */}
      <div style={{
        position: 'absolute',
        top: 56,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.05em',
        color: isReady ? 'var(--crimson)' : 'var(--text-secondary)',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        opacity: progress > 0.4 ? 1 : 0,
        transition: 'opacity 0.2s, color 0.2s',
      }}>
        {isSpinning ? 'Refreshing...' : isReady ? 'Release to refresh' : 'Pull to refresh'}
      </div>
    </div>
  )
}
