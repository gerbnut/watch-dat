'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { cn, getYearFromDate, formatRating } from '@/lib/utils'
import { StarRating } from './StarRating'
import { Film, Star } from 'lucide-react'

interface MovieCardProps {
  tmdbId: number
  title: string
  poster: string | null
  releaseDate?: Date | string | null
  rating?: number | null
  userRating?: number | null
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showRating?: boolean
  showYear?: boolean
  onClick?: () => void
}

const SIZES = {
  xs: { card: 'w-16', img: 'h-24', title: 'text-xs' },
  sm: { card: 'w-24', img: 'h-36', title: 'text-xs' },
  md: { card: 'w-32', img: 'h-48', title: 'text-sm' },
  lg: { card: 'w-44', img: 'h-64', title: 'text-sm' },
}

export function MovieCard({
  tmdbId,
  title,
  poster,
  releaseDate,
  rating,
  userRating,
  className,
  size = 'md',
  showRating = false,
  showYear = true,
  onClick,
}: MovieCardProps) {
  const posterUrl = TMDB_IMAGE.poster(poster, 'w342')
  const year = getYearFromDate(releaseDate ?? null)
  const { card, img, title: titleSize } = SIZES[size]

  const content = (
    <div className={cn('group flex flex-col gap-1.5', card, className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-muted transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-glow-green',
          img
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 30vw, 200px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Film className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {/* Community rating — slides up on hover */}
        {rating && !userRating && (
          <div className="absolute inset-x-0 bottom-0 px-2 py-2 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none">
            <span className="flex items-center gap-0.5 text-xs font-bold text-cinema-400">
              <Star className="h-3 w-3 fill-cinema-400 stroke-none" />
              {rating.toFixed(1)}
            </span>
          </div>
        )}
        {userRating && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
            <StarRating value={userRating} readOnly size="sm" />
          </div>
        )}
      </div>
      <div>
        <p className={cn('font-medium leading-tight line-clamp-2', titleSize)}>{title}</p>
        {showYear && year && (
          <p className="text-xs text-muted-foreground mt-0.5">{year}</p>
        )}
        {showRating && rating && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-cinema-400 font-semibold">★ {formatRating(rating)}</span>
          </div>
        )}
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left">
        {content}
      </button>
    )
  }

  return <Link href={`/film/${tmdbId}`}>{content}</Link>
}
