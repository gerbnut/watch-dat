'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Play, Film, Star } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { cn, getYearFromDate, formatRating } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NowPlayingRowProps {
  title: string
  movies: { id: number; title: string; poster_path: string | null; release_date?: string; vote_average?: number }[]
  seeMoreHref?: string
  icon?: LucideIcon
}

export function NowPlayingRow({ title, movies, seeMoreHref, icon: Icon }: NowPlayingRowProps) {
  const [trailers, setTrailers] = useState<Record<number, string | null>>({})
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null)

  useEffect(() => {
    if (!movies.length) return
    const tmdbIds = movies.map((m) => m.id).join(',')
    fetch(`/api/movies/trailers?tmdbIds=${tmdbIds}`)
      .then((r) => r.json())
      .then(setTrailers)
      .catch(() => {})
  }, [movies])

  if (!movies.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-cinema-400" />}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="flex items-center gap-0.5 text-sm text-cinema-400 hover:text-cinema-300 transition-colors"
          >
            See more <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {movies.map((movie, i) => {
            const posterUrl = TMDB_IMAGE.poster(movie.poster_path, 'w342')
            const year = getYearFromDate(movie.release_date ?? null)
            const trailerKey = trailers[movie.id]

            return (
              <div key={movie.id} className="shrink-0 w-24 flex flex-col gap-1.5">
                <div className="relative overflow-hidden rounded-lg bg-muted h-36 group">
                  <Link href={`/film/${movie.id}`} className="absolute inset-0 z-0">
                    {posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        loading={i < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/[0.02]">
                        <Film className="h-8 w-8 text-muted-foreground/20" />
                      </div>
                    )}
                  </Link>
                  <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06] pointer-events-none" />

                  {/* Play button overlay — outside Link so it doesn't trigger navigation */}
                  {trailerKey && (
                    <button
                      onClick={() => setActiveTrailer(trailerKey)}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors"
                    >
                      <div className="rounded-full bg-black/60 backdrop-blur-sm p-2 opacity-80 hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </button>
                  )}
                </div>
                <Link href={`/film/${movie.id}`}>
                  <p className="text-xs font-medium leading-tight line-clamp-2">{movie.title}</p>
                  {year && <p className="text-xs text-muted-foreground mt-0.5">{year}</p>}
                  {movie.vote_average != null && movie.vote_average > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-cinema-400 font-semibold">
                        <Star className="inline h-3 w-3 fill-cinema-400 stroke-none" /> {formatRating(movie.vote_average)}
                      </span>
                    </div>
                  )}
                </Link>
              </div>
            )
          })}
        </div>
        <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* Trailer dialog */}
      <Dialog open={!!activeTrailer} onOpenChange={() => setActiveTrailer(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-white/[0.06]">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {activeTrailer && (
              <iframe
                src={`https://www.youtube.com/embed/${activeTrailer}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
