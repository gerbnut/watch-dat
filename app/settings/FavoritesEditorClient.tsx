'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Loader2, Plus } from 'lucide-react'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { Button } from '@/components/ui/button'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { toast } from '@/hooks/use-toast'

interface FavoriteMovie {
  tmdbId: number
  title: string
  poster: string | null
}

interface FavoritesEditorClientProps {
  username: string
  initialFavorites: FavoriteMovie[]
}

export function FavoritesEditorClient({ username, initialFavorites }: FavoritesEditorClientProps) {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>(initialFavorites)
  const [saving, setSaving] = useState(false)

  function handleAdd(movie: { id: number; title: string; poster_path: string | null }) {
    if (favorites.length >= 5) {
      toast({ title: 'Max 5 favorites', description: 'Remove a film first', variant: 'destructive' })
      return
    }
    if (favorites.some((f) => f.tmdbId === movie.id)) return
    setFavorites((prev) => [...prev, { tmdbId: movie.id, title: movie.title, poster: movie.poster_path }])
  }

  function handleRemove(tmdbId: number) {
    setFavorites((prev) => prev.filter((f) => f.tmdbId !== tmdbId))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${username}/favorites`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbIds: favorites.map((f) => f.tmdbId) }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Favorites saved!', variant: 'success' as any })
    } catch {
      toast({ title: 'Error', description: 'Failed to save favorites', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Favorite Films</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{favorites.length} / 5 selected</p>
        </div>
        <Button variant="cinema" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {favorites.map((film) => (
          <div key={film.tmdbId} className="relative group">
            <div className="relative w-[60px] h-[90px] rounded-md overflow-hidden bg-muted shadow-md">
              {film.poster ? (
                <Image
                  src={TMDB_IMAGE.poster(film.poster, 'w185')!}
                  alt={film.title}
                  fill
                  className="object-cover"
                  sizes="60px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-[10px] text-center px-1 leading-tight">
                  {film.title}
                </div>
              )}
            </div>
            <button
              onClick={() => handleRemove(film.tmdbId)}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 5 - favorites.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-[60px] h-[90px] rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/30"
          >
            <Plus className="h-5 w-5" />
          </div>
        ))}
      </div>

      {favorites.length < 5 && (
        <MovieSearch
          placeholder="Search to add a film..."
          navigateOnSelect={false}
          onSelect={handleAdd}
        />
      )}
    </div>
  )
}
