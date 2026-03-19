'use client'

import { useRef, useCallback } from 'react'
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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function pointerToValue(clientX: number, rect: DOMRect): number {
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
  const raw = MIN + ratio * (MAX - MIN)
  return Math.round(raw * 10) / 10
}

export function RulerRating({ value, onChange, className }: RulerRatingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current
      if (!container) return
      dragging.current = true
      container.setPointerCapture(e.pointerId)
      const rect = container.getBoundingClientRect()
      onChange(pointerToValue(e.clientX, rect))
    },
    [onChange],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      onChange(pointerToValue(e.clientX, rect))
    },
    [onChange],
  )

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const displayValue = value ?? 5.0
  const fillPercent = ((displayValue - MIN) / (MAX - MIN)) * 100

  return (
    <div className={cn('space-y-2', className)}>
      {/* Value display */}
      <div className="text-center">
        <span className="text-3xl font-black text-cinema-400 tabular-nums">
          {displayValue.toFixed(1)}
        </span>
      </div>

      {/* Ruler container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative cursor-pointer select-none py-3 px-1"
        style={{ touchAction: 'none' }}
      >
        {/* Filled track */}
        <div className="absolute left-0 top-1/2 h-1 rounded-full bg-muted-foreground/10 w-full -translate-y-1/2" />
        <div
          className="absolute left-0 top-1/2 h-1 rounded-full bg-cinema-400/40 -translate-y-1/2"
          style={{ width: `${fillPercent}%` }}
        />

        {/* Ticks */}
        <div className="relative h-10">
          {Array.from({ length: TICK_COUNT }, (_, i) => {
            const tickValue = Math.round((MIN + i * STEP) * 10) / 10
            const isWhole = Math.abs(tickValue - Math.round(tickValue)) < 0.01
            const isHalf = !isWhole && Math.abs((tickValue * 10) % 5) < 0.1
            const left = ((tickValue - MIN) / (MAX - MIN)) * 100

            return (
              <div
                key={i}
                className="absolute bottom-0 -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <div
                  className={cn(
                    'w-px rounded-full mx-auto',
                    isWhole
                      ? 'h-6 bg-muted-foreground/50'
                      : isHalf
                        ? 'h-4 bg-muted-foreground/30'
                        : 'h-2.5 bg-muted-foreground/15',
                  )}
                />
                {isWhole && (
                  <span className="absolute top-full left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
                    {Math.round(tickValue)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Active indicator */}
        <div
          className="absolute bottom-0 -translate-x-1/2 pointer-events-none"
          style={{ left: `${fillPercent}%` }}
        >
          <div className="w-0.5 h-8 bg-cinema-400 rounded-full mx-auto" />
          <div className="w-3 h-3 rounded-full bg-cinema-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] -mt-1 mx-auto -translate-x-[0.5px]" />
        </div>
      </div>
    </div>
  )
}
