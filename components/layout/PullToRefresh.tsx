'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hapticNotification } from '@/lib/native'

const THRESHOLD = 72    // px of pull before triggering refresh
const MAX_PULL = 100    // max visual pull cap
const DEAD_ZONE = 12    // px before we treat movement as a pull (not a tap)

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  const pulling = useRef(false)
  const lockedAxis = useRef<'vertical' | 'horizontal' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate when scrolled to top
    if (window.scrollY > 0) return
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
    pulling.current = true
    lockedAxis.current = null
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing) return
    const dy = e.touches[0].clientY - touchStartY.current
    const dx = e.touches[0].clientX - touchStartX.current

    // Lock axis once user moves past dead zone
    if (lockedAxis.current === null && (Math.abs(dx) > DEAD_ZONE || Math.abs(dy) > DEAD_ZONE)) {
      lockedAxis.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }

    // If swiping horizontally, bail out entirely so scroll containers work
    if (lockedAxis.current === 'horizontal') {
      setPullDistance(0)
      return
    }

    if (dy <= 0) {
      setPullDistance(0)
      return
    }
    // Clamp with rubber-band feel
    const clamped = Math.min(dy * 0.5, MAX_PULL)
    setPullDistance(clamped)
    // passive: true listener — no preventDefault needed.
    // overscroll-behavior-y: contain on the container handles native bounce.
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (pullDistance >= THRESHOLD) {
      hapticNotification('success')
      setRefreshing(true)
      setPullDistance(THRESHOLD * 0.6)
      router.refresh()
      await new Promise((r) => setTimeout(r, 800))
      setRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, router])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const isReady = pullDistance >= THRESHOLD

  return (
    <div ref={containerRef} className="relative" style={{ overscrollBehaviorY: 'contain' }}>
      {/* Pull indicator */}
      {(pullDistance > 4 || refreshing) && (
        <div
          className="absolute left-1/2 z-50 flex items-center justify-center"
          style={{
            top: -(THRESHOLD * 0.6) + pullDistance * 0.5,
            transform: 'translateX(-50%)',
            opacity: Math.min(progress * 2, 1),
          }}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-md transition-colors',
            isReady || refreshing ? 'border-cinema-500 text-cinema-400' : 'border-border text-muted-foreground'
          )}>
            <RefreshCw
              className={cn('h-4 w-4 transition-transform', refreshing && 'animate-spin')}
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
          </div>
        </div>
      )}

      {/* Content shifted down while pulling */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.2s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
