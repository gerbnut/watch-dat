'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, ArrowLeft } from 'lucide-react'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { cn } from '@/lib/utils'

interface RatedMovie {
  id: string
  rating: number
  movie: {
    tmdbId: number
    title: string
    poster: string | null
    releaseDate: string | null
  }
}

interface CompareMoviesProps {
  currentMovieTitle: string
  onSelectRating: (rating: number) => void
  onClose: () => void
}

export function CompareMovies({ currentMovieTitle, onSelectRating, onClose }: CompareMoviesProps) {
  const [movies, setMovies] = useState<RatedMovie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reviews/rated')
      .then((r) => r.json())
      .then((data) => setMovies(Array.isArray(data) ? data : []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="space-y-4">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to rating
        </button>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-8 text-center">
          <p className="text-muted-foreground text-sm">Rate some films first to use comparison</p>
        </div>
      </div>
    )
  }

  function handleSlot(index: number) {
    if (movies.length === 0) return
    let rating: number
    if (index === 0) {
      // Top slot: above highest rated
      rating = Math.min((movies[0].rating ?? 10) + 0.5, 10)
    } else if (index >= movies.length) {
      // Bottom slot: below lowest rated
      rating = Math.max((movies[movies.length - 1].rating ?? 1) - 0.5, 1)
    } else {
      // Between two movies
      const above = movies[index - 1].rating ?? 5
      const below = movies[index].rating ?? 5
      rating = Math.round(((above + below) / 2) * 10) / 10
    }
    onSelectRating(rating)
    onClose()
  }

  function handleMovieClick(movie: RatedMovie) {
    onSelectRating(movie.rating!)
    onClose()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to rating
        </button>
        <p className="text-xs text-muted-foreground/60">
          Where does <span className="text-foreground font-medium">{currentMovieTitle}</span> fit?
        </p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-0 -mx-1 px-1">
        {/* Top slot */}
        <SlotButton onClick={() => handleSlot(0)} />

        {movies.map((m, i) => (
          <div key={m.id}>
            <button
              onClick={() => handleMovieClick(m)}
              className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04] transition-colors text-left"
            >
              <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded ring-1 ring-white/[0.06]">
                <MoviePoster
                  poster={m.movie.poster}
                  title={m.movie.title}
                  tmdbSize="w92"
                  sizes="32px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.movie.title}</p>
                {m.movie.releaseDate && (
                  <p className="text-[11px] text-muted-foreground/50">
                    {new Date(m.movie.releaseDate).getFullYear()}
                  </p>
                )}
              </div>
              <span className="text-sm font-bold text-cinema-400 tabular-nums shrink-0">
                {m.rating!.toFixed(1)}
              </span>
            </button>
            {/* Slot between movies */}
            <SlotButton onClick={() => handleSlot(i + 1)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SlotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-1.5 my-0.5',
        'border border-dashed border-white/[0.06] rounded-lg',
        'text-muted-foreground/30 hover:text-cinema-400 hover:border-cinema-400/30 hover:bg-cinema-400/5',
        'transition-all text-xs'
      )}
    >
      <Plus className="h-3 w-3" />
      <span>Place here</span>
    </button>
  )
}
