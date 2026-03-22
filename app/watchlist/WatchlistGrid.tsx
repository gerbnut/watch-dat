'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MovieCard } from '@/components/movies/MovieCard'
import { EditableFilmWrapper } from '@/components/movies/EditableFilmWrapper'
import { toast } from '@/hooks/use-toast'

interface WatchlistFilm {
  tmdbId: number
  title: string
  poster: string | null
  releaseDate: string | null
}

interface WatchlistGridProps {
  films: WatchlistFilm[]
}

export function WatchlistGrid({ films }: WatchlistGridProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [localFilms, setLocalFilms] = useState(films)

  const handleRemove = useCallback(async (id: string) => {
    const tmdbId = Number(id)
    const film = localFilms.find((f) => f.tmdbId === tmdbId)

    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId }),
    })

    if (!res.ok) {
      toast({ title: 'Failed to remove', variant: 'destructive' })
      throw new Error('Failed to remove')
    }

    // Optimistically remove from local state
    setLocalFilms((prev) => prev.filter((f) => f.tmdbId !== tmdbId))
    toast({ title: `Removed ${film?.title ?? 'film'}` })
    router.refresh()
  }, [localFilms, router])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className={
            isEditing
              ? 'gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10'
              : 'gap-1.5 text-muted-foreground hover:text-foreground'
          }
        >
          <Pencil className="h-3.5 w-3.5" />
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          <AnimatePresence mode="popLayout">
            {localFilms.map((film) => (
              <EditableFilmWrapper
                key={film.tmdbId}
                id={String(film.tmdbId)}
                label={film.title}
                isEditing={isEditing}
                onRemove={handleRemove}
              >
                <MovieCard
                  tmdbId={film.tmdbId}
                  title={film.title}
                  poster={film.poster}
                  releaseDate={film.releaseDate}
                  size="sm"
                />
              </EditableFilmWrapper>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  )
}
