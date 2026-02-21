'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heart, Flag, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { CommentsSection } from './CommentsSection'
import { LogFilmModal } from './LogFilmModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/movies/StarRating'
import { MovieCard } from '@/components/movies/MovieCard'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import type { ReviewWithRelations } from '@/types'
import ReactMarkdown from 'react-markdown'

interface ReviewCardProps {
  review: ReviewWithRelations
  showMovie?: boolean
  currentUserId?: string
  expandComments?: boolean
  onLike?: (reviewId: string, liked: boolean) => void
  onDelete?: (reviewId: string) => void
  onEdit?: (review: ReviewWithRelations) => void
}

export function ReviewCard({ review, showMovie = false, currentUserId, expandComments = false, onLike, onDelete, onEdit }: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [likeCount, setLikeCount] = useState(review._count.likes)
  const [isLiked, setIsLiked] = useState(review.isLiked ?? false)
  const [liking, setLiking] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const isOwner = currentUserId === review.user.id

  async function handleLike() {
    if (!currentUserId) {
      // Import toast lazily to avoid server-side issues
      const { toast } = await import('@/hooks/use-toast')
      toast({ title: 'Sign in to like', description: 'Create an account to like reviews.' })
      return
    }
    if (liking) return
    setLiking(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((c) => newLiked ? c + 1 : c - 1)

    try {
      const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' })
      const data = await res.json()
      setIsLiked(data.liked)
      setLikeCount(data.likeCount) // authoritative server count
      onLike?.(review.id, data.liked)
    } catch {
      setIsLiked(!newLiked)
      setLikeCount((c) => !newLiked ? c + 1 : c - 1)
    } finally {
      setLiking(false)
    }
  }

  return (
    <>
    <article className="rounded-lg border bg-card p-4 space-y-3 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link href={`/user/${review.user.username}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.user.avatar ?? undefined} alt={review.user.displayName} />
              <AvatarFallback className="text-xs">{getInitials(review.user.displayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/user/${review.user.username}`} className="text-sm font-semibold hover:underline">
                {review.user.displayName}
              </Link>
              {review.liked && (
                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(review.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {review.rating && <StarRating value={review.rating} readOnly size="sm" />}
          {isOwner && (
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMenu(!showMenu)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border bg-popover shadow-lg">
                  <button
                    onClick={() => { setShowMenu(false); setEditOpen(true) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onDelete?.(review.id) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showMovie && review.movie && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
          <MovieCard
            tmdbId={review.movie.tmdbId}
            title={review.movie.title}
            poster={review.movie.poster}
            releaseDate={review.movie.releaseDate}
            size="xs"
            showYear={false}
          />
          <div>
            <Link href={`/film/${review.movie.tmdbId}`} className="text-sm font-medium hover:underline">
              {review.movie.title}
            </Link>
            {review.movie.releaseDate && (
              <p className="text-xs text-muted-foreground">
                {new Date(review.movie.releaseDate).getFullYear()}
              </p>
            )}
          </div>
        </div>
      )}

      {review.text && (
        <div>
          {review.hasSpoiler && !spoilerRevealed ? (
            <div>
              <div className="rounded bg-muted/80 px-3 py-2 blur-sm select-none text-sm line-clamp-3">
                {review.text}
              </div>
              <button
                onClick={() => setSpoilerRevealed(true)}
                className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Flag className="h-3 w-3" />
                Contains spoilers — click to reveal
              </button>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{review.text}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleLike}
          disabled={liking}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-all',
            isLiked ? 'text-cinema-400' : 'text-muted-foreground hover:text-cinema-400',
            liking && 'scale-110'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isLiked && 'fill-current',
              liking && 'scale-125'
            )}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        {review.hasSpoiler && (
          <Badge variant="outline" className="text-xs h-5 border-amber-600/50 text-amber-500">
            spoiler
          </Badge>
        )}
        {review.rewatch && (
          <Badge variant="outline" className="text-xs h-5">
            rewatch
          </Badge>
        )}
      </div>

      {/* CommentsSection is full-width below the actions row so the input
          never overflows on narrow mobile viewports */}
      <CommentsSection
        reviewId={review.id}
        initialCount={review._count.comments}
        currentUserId={currentUserId}
        defaultExpanded={expandComments}
      />
    </article>

    {editOpen && (
      <LogFilmModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editReviewId={review.id}
        editInitial={{
          rating: review.rating ?? null,
          text: review.text ?? '',
          liked: (review as any).liked ?? false,
          hasSpoiler: review.hasSpoiler ?? false,
          rewatch: review.rewatch ?? false,
          watchedDate: (review as any).watchedDate
            ? new Date((review as any).watchedDate).toISOString().split('T')[0]
            : '',
        }}
        preselectedMovie={
          (review as any).movie
            ? {
                id: (review as any).movie.tmdbId,
                title: (review as any).movie.title,
                poster_path: (review as any).movie.poster ?? null,
                release_date: (review as any).movie.releaseDate
                  ? new Date((review as any).movie.releaseDate).toISOString().split('T')[0]
                  : '',
              }
            : undefined
        }
        onSuccess={() => setEditOpen(false)}
      />
    )}
  </>
  )
}
