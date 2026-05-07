'use client'

import { TMDB_IMAGE } from '@/lib/tmdb'

interface SlideBackdropProps {
  backdrop: string | null
  gradient?: string
}

export function SlideBackdrop({
  backdrop,
  gradient = 'from-black/90 via-black/60 to-black/90',
}: SlideBackdropProps) {
  const url = backdrop ? TMDB_IMAGE.backdrop(backdrop, 'w1280') : null

  return (
    <div className="absolute inset-0">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />
    </div>
  )
}
