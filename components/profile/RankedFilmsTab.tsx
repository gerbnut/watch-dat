'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MovieCard } from '@/components/movies/MovieCard'

interface RankedFilm {
  movieId: string
  tmdbId: number
  title: string
  poster: string | null
  releaseDate: string | null
  rating: number
  rank: number
}

export function RankedFilmsTab({ username }: { username: string }) {
  const [films, setFilms] = useState<RankedFilm[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (offset: number) => {
    if (loading) return
    setLoading(true)
    try {
      const url = `/api/users/${username}/ranked?offset=${offset}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setFilms(prev => offset > 0 ? [...prev, ...json.data] : json.data)
      setHasMore(json.hasMore)
      setNextOffset(json.nextOffset)
      setLoaded(true)
    } catch (err) {
      console.error('Ranked load error:', err)
    } finally {
      setLoading(false)
    }
  }, [username, loading])

  // Initial load
  useEffect(() => {
    if (!loaded) load(0)
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && loaded && nextOffset !== null) {
          load(nextOffset)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loaded, nextOffset, load])

  if (!loaded && loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton rounded-lg aspect-[2/3]" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (loaded && films.length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-sm">No rated films yet.</p>
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {films.map((film) => (
          <div key={film.movieId} className="relative">
            {/* Rank badge */}
            <div className="absolute top-1 left-1 z-10 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums">
              #{film.rank}
            </div>
            <MovieCard
              tmdbId={film.tmdbId}
              title={film.title}
              poster={film.poster}
              releaseDate={film.releaseDate}
              userRating={film.rating}
              size="sm"
              showYear={false}
            />
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 border-2 border-cinema-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
