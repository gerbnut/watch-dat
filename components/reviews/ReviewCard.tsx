'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flag, MoreHorizontal, Trash2, Pencil, Heart, MessageSquare } from 'lucide-react'
import { CommentsSection } from './CommentsSection'
import { LogFilmModal } from './LogFilmModal'
import { ReportModal } from '@/components/ui/ReportModal'
import { AnimatedLikeButton } from '@/components/ui/AnimatedLikeButton'
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

export function ReviewCard({
  review,
  showMovie = false,
  currentUserId,
  expandComments = false,
  onLike,
  onDelete,
  onEdit,
}: ReviewCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [likeCount, setLikeCount] = useState(review._count.likes)
  const [isLiked, setIsLiked] = useState(review.isLiked ?? false)
  const [liking, setLiking] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(expandComments)

  const isOwner = currentUserId === review.user.id
  const [reportOpen, setReportOpen] = useState(false)

  async function handleLike() {
    if (!currentUserId) {
      const { toast } = await import('@/hooks/use-toast')
      toast({ title: 'Sign in to like', description: 'Create an account to like reviews.' })
      return
    }
    if (liking) return
    setLiking(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((c) => (newLiked ? c + 1 : c - 1))

    try {
      const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' })
      const data = await res.json()
      setIsLiked(data.liked)
      setLikeCount(data.likeCount)
      onLike?.(review.id, data.liked)
    } catch {
      setIsLiked(!newLiked)
      setLikeCount((c) => (!newLiked ? c + 1 : c - 1))
    } finally {
      setLiking(false)
    }
  }

  // Close menu on outside click
  React.useEffect(() => {
    if (!showMenu) return
    const close = () => setShowMenu(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [showMenu])

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border bg-card p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/user/${review.user.username}`} className="shrink-0">
              <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-cinema-500/40 transition-all">
                <AvatarImage src={review.user.avatar ?? undefined} alt={review.user.displayName} />
                <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                  {getInitials(review.user.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/user/${review.user.username}`}
                  className="text-sm font-semibold hover:text-cinema-400 transition-colors"
                >
                  {review.user.displayName}
                </Link>
                {review.liked && <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(review.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {review.rating && <StarRating value={review.rating} readOnly size="sm" />}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 touch-manipulation"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border bg-popover shadow-lg py-1"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {isOwner && (
                    <>
                      <button
                        onClick={() => { setShowMenu(false); setEditOpen(true) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent touch-manipulation"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onDelete?.(review.id) }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 touch-manipulation"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  )}
                  {!isOwner && currentUserId && (
                    <button
                      onClick={() => { setShowMenu(false); setReportOpen(true) }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                    >
                      <Flag className="h-3.5 w-3.5" /> Report
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Movie context */}
        {showMovie && review.movie && (
          <Link href={`/film/${review.movie.tmdbId}`}>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors p-2">
              <MovieCard
                tmdbId={review.movie.tmdbId}
                title={review.movie.title}
                poster={review.movie.poster}
                releaseDate={review.movie.releaseDate}
                size="xs"
                showYear={false}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{review.movie.title}</p>
                {review.movie.releaseDate && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.movie.releaseDate).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Review text */}
        {review.text && (
          <div>
            {review.hasSpoiler && !spoilerRevealed ? (
              <div>
                <div className="rounded-lg bg-muted/80 px-3 py-2 blur-sm select-none text-sm line-clamp-3">
                  {review.text}
                </div>
                <button
                  onClick={() => setSpoilerRevealed(true)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                >
                  <Flag className="h-3 w-3" />
                  Contains spoilers — tap to reveal
                </button>
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{review.text}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-3 pt-0.5">
          <AnimatedLikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            onClick={handleLike}
            disabled={liking}
          />

          <button
            onClick={() => setCommentsOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors touch-manipulation',
              commentsOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MessageSquare className="h-4 w-4" />
            {review._count.comments > 0 && <span>{review._count.comments}</span>}
          </button>

          <div className="flex items-center gap-2 ml-auto">
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
        </div>

        {/* Comments */}
        {commentsOpen && (
          <CommentsSection
            reviewId={review.id}
            initialCount={review._count.comments}
            currentUserId={currentUserId}
            defaultExpanded={expandComments}
            open={commentsOpen}
          />
        )}
      </motion.article>

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
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="REVIEW"
        targetId={review.id}
        targetLabel={review.movie?.title}
      />
    </>
  )
}
