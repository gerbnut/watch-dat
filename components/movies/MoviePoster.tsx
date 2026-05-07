'use client'

import { useState } from 'react'
import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500'

interface MoviePosterProps {
  /** Raw TMDB poster path, e.g. "/abc123.jpg". Null shows Film icon placeholder. */
  poster: string | null
  /** Used as alt text on the image */
  title: string
  /** TMDB image size to fetch — match to the actual rendered size */
  tmdbSize?: PosterSize
  /** CSS sizes hint — accepted for backwards-compat but unused (no responsive generation). */
  sizes?: string
  /** true = above-the-fold hero image; sets loading="eager" */
  priority?: boolean
  /** Applied to the <img> element (e.g. "object-cover object-top") */
  className?: string
}

/**
 * Renders a TMDB movie poster filling its parent container.
 * Parent must be `position: relative` with explicit dimensions.
 * When poster is null, shows a dark placeholder with a Film icon.
 */
export function MoviePoster({
  poster,
  title,
  tmdbSize = 'w342',
  priority = false,
  className,
}: MoviePosterProps) {
  const src = poster ? `${TMDB_IMAGE_BASE}/${tmdbSize}${poster}` : null
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <Film className="h-1/3 w-1/3 text-muted-foreground opacity-40" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
      onError={() => setImgError(true)}
    />
  )
}
