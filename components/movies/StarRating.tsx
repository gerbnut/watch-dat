'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const SIZES = {
  sm: { star: 'w-4 h-4', text: 'text-xs' },
  md: { star: 'w-6 h-6', text: 'text-sm' },
  lg: { star: 'w-8 h-8', text: 'text-base' },
}

export function StarRating({ value, onChange, readOnly = false, size = 'md', showValue = false, className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [animStar, setAnimStar] = useState<number | null>(null)

  // Convert 1-10 scale to 1-5 stars
  const starsValue = value ? value / 2 : null
  const displayValue = hovered ?? starsValue

  const { star: starSize, text: textSize } = SIZES[size]

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>, starIndex: number) {
    if (readOnly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const half = x < rect.width / 2
    setHovered(half ? starIndex - 0.5 : starIndex)
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>, starIndex: number) {
    if (readOnly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const half = x < rect.width / 2
    const rating = (half ? starIndex - 0.5 : starIndex) * 2 // Convert back to 1-10
    onChange(rating)
    setAnimStar(starIndex)
    setTimeout(() => setAnimStar(null), 220)
  }

  function getFill(starIndex: number): 'full' | 'half' | 'empty' {
    if (!displayValue) return 'empty'
    if (displayValue >= starIndex) return 'full'
    if (displayValue >= starIndex - 0.5) return 'half'
    return 'empty'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className="flex gap-0.5"
        onMouseLeave={() => !readOnly && setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = getFill(star)
          return (
            <svg
              key={star}
              viewBox="0 0 24 24"
              className={cn(
                starSize,
                readOnly ? 'cursor-default' : 'cursor-pointer',
                !readOnly && 'transition-transform duration-100 hover:scale-125',
                animStar === star && 'animate-star-pop',
              )}
              onMouseMove={(e) => handleMouseMove(e, star)}
              onClick={(e) => handleClick(e, star)}
            >
              <defs>
                <linearGradient id={`half-${star}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor="currentColor" className="text-cinema-400" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              {fill === 'full' ? (
                <polygon
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  className="fill-cinema-400 stroke-cinema-400"
                  strokeWidth="1"
                  style={{ transition: 'fill 0.12s ease-out, stroke 0.12s ease-out' }}
                />
              ) : fill === 'half' ? (
                <>
                  <polygon
                    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                    className="fill-none stroke-cinema-400/50"
                    strokeWidth="1.5"
                    style={{ transition: 'stroke 0.12s ease-out' }}
                  />
                  <clipPath id={`clip-half-${star}`}>
                    <rect x="0" y="0" width="12" height="24" />
                  </clipPath>
                  <polygon
                    points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                    className="fill-cinema-400 stroke-none"
                    clipPath={`url(#clip-half-${star})`}
                    style={{ transition: 'fill 0.12s ease-out' }}
                  />
                </>
              ) : (
                <polygon
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  className="fill-none stroke-muted-foreground/40"
                  strokeWidth="1.5"
                  style={{ transition: 'fill 0.12s ease-out, stroke 0.12s ease-out' }}
                />
              )}
            </svg>
          )
        })}
      </div>
      {showValue && displayValue && (
        <span className={cn('font-medium text-cinema-400', textSize)}>
          {(displayValue * 2).toFixed(1)}
        </span>
      )}
    </div>
  )
}
