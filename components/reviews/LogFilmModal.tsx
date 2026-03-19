'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RulerRating } from '@/components/movies/RulerRating'
import { CompareMovies } from '@/components/reviews/CompareMovies'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { Heart, Flag, RefreshCw, Loader2, X, Scale } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { FieldError } from '@/components/ui/FieldError'
import { toast } from '@/hooks/use-toast'
import { MoviePoster } from '@/components/movies/MoviePoster'
import TextareaAutosize from 'react-textarea-autosize'

interface SelectedMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

interface EditInitial {
  rating: number | null
  text: string
  liked: boolean
  hasSpoiler: boolean
  rewatch: boolean
  watchedDate: string
}

interface LogFilmModalProps {
  open: boolean
  onClose: () => void
  preselectedMovie?: SelectedMovie | null
  onSuccess?: () => void
  /** If provided, the modal opens in edit mode and PATCHes this review id */
  editReviewId?: string
  editInitial?: EditInitial
}

export function LogFilmModal({ open, onClose, preselectedMovie, onSuccess, editReviewId, editInitial }: LogFilmModalProps) {
  const editMode = !!editReviewId

  const [movie, setMovie] = useState<SelectedMovie | null>(preselectedMovie ?? null)
  const [rating, setRating] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [liked, setLiked] = useState(false)
  const [hasSpoiler, setHasSpoiler] = useState(false)
  const [rewatch, setRewatch] = useState(false)
  const [watchedDate, setWatchedDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'))
  const [submitting, setSubmitting] = useState(false)
  const [dateError, setDateError] = useState('')
  const [showCompare, setShowCompare] = useState(false)

  // Pre-populate fields when opening in edit mode
  React.useEffect(() => {
    if (open && editMode && editInitial) {
      setRating(editInitial.rating)
      setText(editInitial.text)
      setLiked(editInitial.liked)
      setHasSpoiler(editInitial.hasSpoiler)
      setRewatch(editInitial.rewatch)
      setWatchedDate(editInitial.watchedDate || formatDate(new Date(), 'yyyy-MM-dd'))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (preselectedMovie) setMovie(preselectedMovie)
  }, [preselectedMovie])

  async function handleSubmit() {
    const today = formatDate(new Date(), 'yyyy-MM-dd')
    if (watchedDate && watchedDate > today) {
      setDateError("Watched date can't be in the future")
      return
    }
    if (text.length > 10000) {
      return // text counter already shows the error state visually
    }
    setSubmitting(true)
    try {
      if (editMode) {
        const res = await fetch(`/api/reviews/${editReviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          throw new Error(err.error ?? 'Failed to update')
        }
        toast({ title: 'Updated!', description: 'Your review has been saved', variant: 'success' })
        onSuccess?.()
        handleClose()
        return
      }

      if (!movie) return
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

      toast({ title: 'Logged!', description: `${movie.title} added to your diary`, variant: 'success' })
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
    setDateError('')
    setShowCompare(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'min(90vh, 100dvh - env(keyboard-inset-height, 0px) - 2rem)', touchAction: 'pan-y' }}>
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit review' : 'Log a film'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preselectedMovie && !editMode && (
            <MovieSearch
              onSelect={(m) => setMovie(m)}
              navigateOnSelect={false}
              placeholder="Search for a film..."
              inModal
            />
          )}

          {movie && (
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/[0.06]">
                <MoviePoster
                  poster={movie.poster_path}
                  title={movie.title}
                  tmdbSize="w154"
                  sizes="44px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{movie.title}</p>
                {movie.release_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </div>
              {!preselectedMovie && !editMode && (
                <button onClick={() => setMovie(null)} className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {showCompare && movie ? (
            <CompareMovies
              currentMovieTitle={movie.title}
              onSelectRating={(v) => setRating(v)}
              onClose={() => setShowCompare(false)}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rating</label>
                {rating && (
                  <button
                    onClick={() => setRating(null)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    clear
                  </button>
                )}
              </div>
              <RulerRating value={rating} onChange={setRating} />
              {movie && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-white/[0.06]" />
                  <span className="text-xs text-muted-foreground/40">or</span>
                  <div className="flex-1 border-t border-white/[0.06]" />
                </div>
              )}
              {movie && (
                <button
                  onClick={() => setShowCompare(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5 text-sm text-foreground hover:bg-white/[0.03] transition-colors"
                >
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Compare to Movies I've Seen
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Date watched</label>
            <Input
              type="date"
              value={watchedDate}
              onChange={(e) => { setWatchedDate(e.target.value); setDateError('') }}
              max={formatDate(new Date(), 'yyyy-MM-dd')}
            />
            <FieldError msg={dateError} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Review (optional)</label>
            <TextareaAutosize
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think? Markdown supported..."
              minRows={3}
              maxRows={10}
              className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.04] px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:border-cinema-500/30 focus-visible:ring-2 focus-visible:ring-cinema-500/10"
            />
            {text.length > 8000 && (
              <p className={cn('text-xs text-right', text.length > 10000 ? 'text-destructive' : 'text-muted-foreground/40')}>
                {text.length.toLocaleString()}/10,000
              </p>
            )}
            {text.length > 10000 && (
              <FieldError msg="Review must be 10,000 characters or less" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setLiked(!liked)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 active:scale-95',
                liked
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-white/[0.06] text-muted-foreground/60 bg-transparent hover:border-red-500/20 hover:text-red-400/70'
              )}
            >
              <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
              Liked
            </button>
            <button
              onClick={() => setRewatch(!rewatch)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 active:scale-95',
                rewatch
                  ? 'border-cinema-500/30 bg-cinema-500/10 text-cinema-400'
                  : 'border-white/[0.06] text-muted-foreground/60 bg-transparent hover:border-cinema-500/20 hover:text-cinema-400/70'
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Rewatch
            </button>
            {text && (
              <button
                onClick={() => setHasSpoiler(!hasSpoiler)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 active:scale-95',
                  hasSpoiler
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-white/[0.06] text-muted-foreground/60 bg-transparent hover:border-amber-500/20 hover:text-amber-400/70'
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                Spoiler
              </button>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <Button variant="cinema" className="w-full" onClick={handleSubmit} disabled={(!movie && !editMode) || submitting || text.length > 10000}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editMode ? 'Save Changes' : 'Log Film'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
