'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StarRating } from '@/components/movies/StarRating'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { Heart, Flag, RefreshCw, Film, Loader2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { TMDB_IMAGE } from '@/lib/tmdb'
import Image from 'next/image'
import { toast } from '@/hooks/use-toast'
import TextareaAutosize from 'react-textarea-autosize'

interface SelectedMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

interface LogFilmModalProps {
  open: boolean
  onClose: () => void
  preselectedMovie?: SelectedMovie | null
  onSuccess?: () => void
}

export function LogFilmModal({ open, onClose, preselectedMovie, onSuccess }: LogFilmModalProps) {
  const [movie, setMovie] = useState<SelectedMovie | null>(preselectedMovie ?? null)
  const [rating, setRating] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [liked, setLiked] = useState(false)
  const [hasSpoiler, setHasSpoiler] = useState(false)
  const [rewatch, setRewatch] = useState(false)
  const [watchedDate, setWatchedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'))
  const [submitting, setSubmitting] = useState(false)

  React.useEffect(() => {
    if (preselectedMovie) setMovie(preselectedMovie)
  }, [preselectedMovie])

  async function handleSubmit() {
    if (!movie) return
    setSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: movie.id,
          rating: rating ?? null,
          text: text.trim() || null,
          liked,
          hasSpoiler,
          rewatch,
          watchedDate: watchedDate || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }

      toast({ title: 'Logged!', description: `${movie.title} added to your diary`, variant: 'success' as any })
      onSuccess?.()
      handleClose()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setMovie(preselectedMovie ?? null)
    setRating(null)
    setText('')
    setLiked(false)
    setHasSpoiler(false)
    setRewatch(false)
    setWatchedDate(formatDate(new Date(), 'yyyy-MM-dd'))
    onClose()
  }

  const posterUrl = movie?.poster_path ? TMDB_IMAGE.poster(movie.poster_path, 'w185') : null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a film</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preselectedMovie && (
            <MovieSearch
              onSelect={(m) => setMovie(m)}
              navigateOnSelect={false}
              placeholder="Search for a film..."
            />
          )}

          {movie && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
                {posterUrl ? (
                  <Image src={posterUrl} alt={movie.title} fill className="object-cover" sizes="44px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted rounded">
                    <Film className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{movie.title}</p>
                {movie.release_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" showValue />
              {rating && (
                <button
                  onClick={() => setRating(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date watched</label>
            <Input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              max={formatDate(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Review (optional)</label>
            <TextareaAutosize
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think? Markdown supported..."
              minRows={3}
              maxRows={10}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
              Liked it
            </button>
            <button
              onClick={() => setRewatch(!rewatch)}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                rewatch ? 'text-blue-400' : 'text-muted-foreground hover:text-blue-400'
              )}
            >
              <RefreshCw className="h-4 w-4" />
              Rewatch
            </button>
            {text && (
              <button
                onClick={() => setHasSpoiler(!hasSpoiler)}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  hasSpoiler ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
                )}
              >
                <Flag className="h-4 w-4" />
                Spoiler
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="cinema" onClick={handleSubmit} disabled={!movie || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
