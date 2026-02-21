'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Loader2, Shuffle } from 'lucide-react'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { Button } from '@/components/ui/button'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { cn } from '@/lib/utils'

interface SuggestedMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

interface SelectedMovie {
  tmdbId: number
  title: string
  poster: string | null
}

interface Props {
  suggestions: SuggestedMovie[]
  username: string
  displayName: string
}

export function OnboardingClient({ suggestions, username, displayName }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<SelectedMovie[]>([])
  const [saving, setSaving] = useState(false)

  function toggle(movie: SuggestedMovie) {
    setSelected((prev) => {
      const exists = prev.find((m) => m.tmdbId === movie.id)
      if (exists) return prev.filter((m) => m.tmdbId !== movie.id)
      if (prev.length >= 5) return prev
      return [...prev, { tmdbId: movie.id, title: movie.title, poster: movie.poster_path }]
    })
  }

  function handleSearchSelect(movie: { id: number; title: string; poster_path: string | null }) {
    setSelected((prev) => {
      if (prev.find((m) => m.tmdbId === movie.id)) return prev
      if (prev.length >= 5) return prev
      return [...prev, { tmdbId: movie.id, title: movie.title, poster: movie.poster_path }]
    })
  }

  async function handleFinish(skip = false) {
    setSaving(true)
    try {
      if (!skip && selected.length > 0) {
        await fetch(`/api/users/${username}/favorites`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbIds: selected.map((m) => m.tmdbId) }),
        })
      }
    } catch {
      // Non-fatal — proceed anyway
    } finally {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      {/* Header */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">Welcome, {displayName}!</p>
        <h1 className="text-2xl font-bold">Pick your favourite films</h1>
        <p className="text-sm text-muted-foreground">
          Choose up to 5 films that defined your taste. They'll appear on your profile and help us personalise your feed.
        </p>
      </div>

      {/* Selected strip */}
      {selected.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          {selected.map((film) => (
            <button
              key={film.tmdbId}
              onClick={() => setSelected((prev) => prev.filter((m) => m.tmdbId !== film.tmdbId))}
              className="relative group"
              title={`Remove ${film.title}`}
            >
              <div className="relative w-14 h-[84px] rounded-md overflow-hidden shadow-md ring-2 ring-cinema-500">
                {film.poster ? (
                  <Image
                    src={TMDB_IMAGE.poster(film.poster, 'w185')!}
                    alt={film.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[9px] text-center px-1 leading-tight text-muted-foreground bg-muted">
                    {film.title}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] text-white font-medium">Remove</span>
                </div>
              </div>
            </button>
          ))}
          <span className="text-xs text-muted-foreground">{selected.length}/5</span>
        </div>
      )}

      {/* Search */}
      <MovieSearch
        placeholder="Search for any film…"
        navigateOnSelect={false}
        onSelect={handleSearchSelect}
      />

      {/* Suggestions grid */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
          <Shuffle className="h-3.5 w-3.5" /> Popular right now
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {suggestions.map((movie) => {
            const isSelected = selected.some((m) => m.tmdbId === movie.id)
            const isDisabled = !isSelected && selected.length >= 5
            return (
              <button
                key={movie.id}
                onClick={() => toggle(movie)}
                disabled={isDisabled}
                className={cn(
                  'relative rounded-md overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cinema-500',
                  isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                )}
                title={movie.title}
              >
                <div className="relative w-full aspect-[2/3] bg-muted">
                  {movie.poster_path ? (
                    <Image
                      src={TMDB_IMAGE.poster(movie.poster_path, 'w185')!}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 16.6vw, 12.5vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-center px-1 leading-tight text-muted-foreground">
                      {movie.title}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-cinema-500/70 flex items-center justify-center">
                      <Check className="h-6 w-6 text-black" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions — sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-sm p-4 flex gap-3 justify-end md:bottom-0">
        <Button variant="ghost" size="sm" onClick={() => handleFinish(true)} disabled={saving}>
          Skip for now
        </Button>
        <Button
          variant="cinema"
          size="sm"
          onClick={() => handleFinish(false)}
          disabled={saving}
          className="min-w-[140px]"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : selected.length > 0 ? (
            `Save & get started`
          ) : (
            'Get started'
          )}
        </Button>
      </div>
    </div>
  )
}
