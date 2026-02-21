'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const THRESHOLD = 72 // px of pull before triggering refresh
const MAX_PULL = 100  // max pull distance shown

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate when scrolled to top
    if (window.scrollY > 0) return
    touchStartY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || refreshing) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy <= 0) {
      setPullDistance(0)
      return
    }
    // Clamp with rubber-band feel
    const clamped = Math.min(dy * 0.5, MAX_PULL)
    setPullDistance(clamped)
    if (clamped > 0) e.preventDefault()
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (pullDistance >= THRESHOLD) {
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
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
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
    <div ref={containerRef} className="relative">
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
