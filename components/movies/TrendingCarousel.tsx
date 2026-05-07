'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { Star, Users, Play, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendingMovie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  vote_average?: number
  overview?: string
  trailerKey?: string | null
}

interface FollowingRating {
  avg: number
  count: number
}

interface TrendingCarouselProps {
  movies: TrendingMovie[]
}

export function TrendingCarousel({ movies }: TrendingCarouselProps) {
  const [followingRatings, setFollowingRatings] = useState<Record<number, FollowingRating>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tmdbIds = movies.map((m) => m.id).join(',')
    fetch(`/api/movies/following-ratings?tmdbIds=${tmdbIds}`)
      .then((r) => r.json())
      .then(setFollowingRatings)
      .catch(() => {})
  }, [movies])

  if (!movies.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Trending This Week</h2>
        <Link
          href="/films/genre/trending?title=Trending+This+Week"
          className="flex items-center gap-0.5 text-sm text-cinema-400 hover:text-cinema-300 transition-colors"
        >
          See all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
      >
        {movies.map((movie, i) => {
          const backdrop = TMDB_IMAGE.backdrop(movie.backdrop_path, 'w780')
          const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
          const fr = followingRatings[movie.id]

          return (
            <Link
              key={movie.id}
              href={`/film/${movie.id}`}
              className="shrink-0 group w-[85vw] sm:w-[400px]"
            >
              <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
                {backdrop ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={backdrop}
                    alt={movie.title}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/[0.02]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                {/* Trailer badge */}
                {movie.trailerKey && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90">
                    <Play className="h-3 w-3 fill-current" />
                    Trailer
                  </div>
                )}

                {/* Bottom info */}
                <div className="absolute bottom-0 inset-x-0 p-4 space-y-2">
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 group-hover:text-cinema-300 transition-colors">
                    {movie.title}
                  </h3>
                  {year && (
                    <p className="text-white/60 text-xs">{year}</p>
                  )}

                  {/* Ratings row */}
                  <div className="flex items-center gap-4">
                    {movie.vote_average != null && movie.vote_average > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-cinema-400 stroke-none" />
                        <span className="text-sm font-bold text-cinema-400">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {fr && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-white/50" />
                        <span className="text-sm font-medium text-white/70">
                          {fr.avg.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-white/40">
                          ({fr.count})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
