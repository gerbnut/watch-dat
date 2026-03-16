'use client'

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface RulerRatingProps {
  value: number | null
  onChange: (value: number) => void
  className?: string
}

const MIN = 1.0
const MAX = 10.0
const STEP = 0.1
const TICK_COUNT = Math.round((MAX - MIN) / STEP) + 1 // 91
const TICK_WIDTH = 12 // px per 0.1 step

export function RulerRating({ value, onChange, className }: RulerRatingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserScrolling = useRef(false)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>()

  const valueToScroll = useCallback((v: number) => {
    const container = containerRef.current
    if (!container) return 0
    const halfWidth = container.clientWidth / 2
    const tickIndex = Math.round((v - MIN) / STEP)
    return tickIndex * TICK_WIDTH - halfWidth + TICK_WIDTH / 2
  }, [])

  const scrollToValue = useCallback((v: number, smooth = false) => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ left: valueToScroll(v), behavior: smooth ? 'smooth' : 'auto' })
  }, [valueToScroll])

  // On mount or when value changes externally, scroll to position
  useEffect(() => {
    if (!isUserScrolling.current && value !== null) {
      scrollToValue(value)
    }
  }, [value, scrollToValue])

  // Also set initial position after first render
  useEffect(() => {
    const v = value ?? 5.0
    // Small delay to ensure container is measured
    requestAnimationFrame(() => scrollToValue(v))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    isUserScrolling.current = true
    clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false
    }, 150)

    const halfWidth = container.clientWidth / 2
    const scrollCenter = container.scrollLeft + halfWidth - TICK_WIDTH / 2
    const tickIndex = Math.round(scrollCenter / TICK_WIDTH)
    const clampedIndex = Math.max(0, Math.min(TICK_COUNT - 1, tickIndex))
    const newValue = Math.round((MIN + clampedIndex * STEP) * 10) / 10

    if (newValue !== value) {
      onChange(newValue)
    }
  }, [value, onChange])

  const displayValue = value ?? 5.0

  return (
    <div className={cn('space-y-2', className)}>
      {/* Value display */}
      <div className="text-center">
        <span className="text-5xl font-black text-cinema-400 tabular-nums">
          {displayValue.toFixed(1)}
        </span>
      </div>

      {/* Ruler container */}
      <div className="relative">
        {/* Center indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cinema-400 z-10 -translate-x-1/2 pointer-events-none" />

        {/* Scrollable ruler */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-auto scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className="flex items-end"
            style={{
              // Pad left and right by half the container width so endpoints can center
              paddingLeft: 'calc(50% - 6px)',
              paddingRight: 'calc(50% - 6px)',
            }}
          >
            {Array.from({ length: TICK_COUNT }, (_, i) => {
              const tickValue = Math.round((MIN + i * STEP) * 10) / 10
              const isWhole = Math.abs(tickValue - Math.round(tickValue)) < 0.01
              const isHalf = !isWhole && Math.abs((tickValue * 10) % 5) < 0.1

              return (
                <div
                  key={i}
                  className="flex flex-col items-center shrink-0"
                  style={{
                    width: TICK_WIDTH,
                    scrollSnapAlign: 'center',
                  }}
                >
                  {isWhole && (
                    <span className="text-[10px] text-muted-foreground/70 mb-1 font-medium">
                      {Math.round(tickValue)}
                    </span>
                  )}
                  <div
                    className={cn(
                      'w-px rounded-full',
                      isWhole
                        ? 'h-6 bg-muted-foreground/50'
                        : isHalf
                          ? 'h-4 bg-muted-foreground/30'
                          : 'h-2.5 bg-muted-foreground/15'
                    )}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
