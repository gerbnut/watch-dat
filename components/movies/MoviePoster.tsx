'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500'

interface MoviePosterProps {
  /** Raw TMDB poster path, e.g. "/abc123.jpg". Null shows Film icon placeholder. */
  poster: string | null
  /** Used as alt text on the Image */
  title: string
  /** TMDB image size to fetch — match to the actual rendered size */
  tmdbSize?: PosterSize
  /** CSS sizes hint for the browser, e.g. "44px" or "(max-width: 768px) 30vw, 200px" */
  sizes?: string
  /** true = above-the-fold hero image; skips lazy loading */
  priority?: boolean
  /** Applied to the <Image> element (e.g. "object-cover object-top") */
  className?: string
}

/**
 * Renders a TMDB movie poster with fill layout.
 * Parent must be `position: relative` with explicit dimensions.
 * When poster is null, shows a dark placeholder with a Film icon.
 */
export function MoviePoster({
  poster,
  title,
  tmdbSize = 'w342',
  sizes = '100vw',
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
    <Image
      src={src}
      alt={title}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      onError={() => setImgError(true)}
    />
  )
}
