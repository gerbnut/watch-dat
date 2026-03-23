'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { Eye, Heart, BookOpen, List, UserPlus, Bookmark, MessageSquare, Share2, MoreHorizontal, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommentsSection } from '@/components/reviews/CommentsSection'
import { AnimatedLikeButton } from '@/components/ui/AnimatedLikeButton'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { TMDB_IMAGE } from '@/lib/tmdb'
import type { ActivityWithRelations } from '@/types'
import ReactMarkdown from 'react-markdown'

const ACTIVITY_ICONS = {
  WATCHED: Eye,
  REVIEWED: BookOpen,
  LIKED_REVIEW: Heart,
  ADDED_TO_LIST: List,
  CREATED_LIST: List,
  FOLLOWED_USER: UserPlus,
  ADDED_TO_WATCHLIST: Bookmark,
}

const ACTIVITY_LABELS = {
  WATCHED: 'watched',
  REVIEWED: 'reviewed',
  LIKED_REVIEW: 'liked a review of',
  ADDED_TO_LIST: 'added to a list',
  CREATED_LIST: 'created a list',
  FOLLOWED_USER: 'started following',
  ADDED_TO_WATCHLIST: 'wants to watch',
}

interface ActivityFeedItemProps {
  activity: ActivityWithRelations & { review?: any }
  currentUserId?: string
  onDelete?: (activityId: string) => void
}

export function ActivityFeedItem({ activity, currentUserId, onDelete }: ActivityFeedItemProps) {
  const label = ACTIVITY_LABELS[activity.type] ?? activity.type

  const [likeCount, setLikeCount] = useState<number>(activity.review?._count?.likes ?? 0)
  const [isLiked, setIsLiked] = useState<boolean>(activity.review?.isLiked ?? false)
  const [liking, setLiking] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const isOwner = currentUserId && activity.user.id === currentUserId

  React.useEffect(() => {
    if (!menuOpen) return
    const close = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menuOpen])

  async function handleDelete() {
    if (deleting || !activity.review?.id) return
    setDeleting(true)
    setMenuOpen(false)
    try {
      const res = await fetch(`/api/reviews/${activity.review.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      const { toast } = await import('@/hooks/use-toast')
      toast({ title: 'Review deleted' })
      onDelete?.(activity.id)
    } catch {
      const { toast } = await import('@/hooks/use-toast')
      toast({ title: 'Could not delete review', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleLike() {
    if (!currentUserId || !activity.review?.id) {
      if (!currentUserId) {
        const { toast } = await import('@/hooks/use-toast')
        toast({ title: 'Sign in to like', description: 'Create an account to like reviews.' })
      }
      return
    }
    if (liking) return
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((c) => (newLiked ? c + 1 : c - 1))
    setLiking(true)
    try {
      const res = await fetch(`/api/reviews/${activity.review.id}/like`, { method: 'POST' })
      const data = await res.json()
      setIsLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch {
      setIsLiked(!newLiked)
      setLikeCount((c) => (!newLiked ? c + 1 : c - 1))
    } finally {
      setLiking(false)
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    if (!activity.review?.id) return
    const url = `${window.location.origin}/review/${activity.review.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Watch Dat review', url })
      } else {
        await navigator.clipboard.writeText(url)
        const { toast } = await import('@/hooks/use-toast')
        toast({ title: 'Link copied!' })
      }
    } catch {
      // dismissed share sheet — ignore
    }
  }

  const hasReview = !!activity.review
  const commentCount: number = activity.review?._count?.comments ?? 0
  const backdropUrl = activity.movie?.backdrop
    ? TMDB_IMAGE.backdrop(activity.movie.backdrop, 'w780')
    : null
  const movieYear = activity.movie?.releaseDate
    ? new Date(activity.movie.releaseDate).getFullYear()
    : null

  return (
    <div className="pb-6 last:pb-0">
      {/* Review card — backdrop-led layout */}
      {hasReview && (
        <div className="relative rounded-2xl border border-white/[0.04] bg-card/60 overflow-hidden group hover:border-white/[0.06] transition-colors">
          {/* Full-card tap target */}
          <Link
            href={`/review/${activity.review.id}`}
            className="absolute inset-0 z-0"
            aria-label={`View review of ${activity.movie?.title ?? 'film'}`}
            tabIndex={-1}
          />

          {/* Backdrop image */}
          {backdropUrl ? (
            <div className="relative aspect-[16/8] w-full overflow-hidden">
              <Image
                src={backdropUrl}
                alt={activity.movie?.title ?? ''}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/30 to-transparent" />
            </div>
          ) : activity.movie?.poster ? (
            <div className="relative aspect-[16/8] w-full overflow-hidden bg-muted">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-sm">
                <MoviePoster
                  poster={activity.movie.poster}
                  title={activity.movie.title}
                  tmdbSize="w342"
                  sizes="600px"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-card/20" />
            </div>
          ) : null}

          {/* Content area */}
          <div className="relative z-10 px-4 pt-3 pb-2 pointer-events-none space-y-2">
            {/* Year + Title */}
            {activity.movie && (
              <div>
                {movieYear && (
                  <span className="text-sm font-medium text-cinema-400">{movieYear}</span>
                )}
                <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                  <Link
                    href={`/film/${activity.movie.tmdbId}`}
                    className="pointer-events-auto hover:text-cinema-400 transition-colors"
                    tabIndex={-1}
                  >
                    {activity.movie.title}
                  </Link>
                </h3>
              </div>
            )}

            {/* User row: avatar + name + rating + time */}
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <Link href={`/user/${activity.user.username}`} className="shrink-0">
                <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-cinema-500/40 transition-all">
                  <AvatarImage src={activity.user.avatar ?? undefined} />
                  <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                    {getInitials(activity.user.displayName ?? '')}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap text-sm">
                <Link
                  href={`/user/${activity.user.username}`}
                  className="font-semibold hover:text-cinema-400 transition-colors"
                >
                  {activity.user.displayName}
                </Link>
                {activity.review.rating && (
                  <span className="font-bold text-cinema-400">
                    {activity.review.rating.toFixed(1)}
                  </span>
                )}
                <span className="text-muted-foreground">
                  · {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            </div>

            {/* Review text preview */}
            {activity.review.text && (
              <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed line-clamp-3">
                <ReactMarkdown>{activity.review.text}</ReactMarkdown>
              </div>
            )}
            {activity.review.liked && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <Heart className="h-3 w-3 fill-current" /> Loved it
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="relative z-20 flex items-center gap-1 px-4 py-2.5 border-t border-white/[0.04]">
            <AnimatedLikeButton
              isLiked={isLiked}
              likeCount={likeCount}
              onClick={handleLike}
              disabled={liking}
            />

            <button
              onClick={() => setCommentsOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors ml-1 touch-manipulation',
                commentsOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MessageSquare className="h-4 w-4" />
              {commentCount > 0 && <span>{commentCount}</span>}
            </button>

            <Link
              href={activity.movie ? `/film/${activity.movie.tmdbId}` : '#'}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-1 touch-manipulation"
            >
              <Bookmark className="h-4 w-4" />
            </Link>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto touch-manipulation"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors ml-1 touch-manipulation"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 bottom-full mb-1 w-36 rounded-lg border border-white/[0.08] bg-card shadow-lg z-50 py-1">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting ? 'Deleting…' : 'Delete review'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          {commentsOpen && (
            <div className="relative z-20 border-t border-white/[0.04] px-3 py-3">
              <CommentsSection
                reviewId={activity.review.id}
                initialCount={commentCount}
                currentUserId={currentUserId}
                open={commentsOpen}
              />
            </div>
          )}
        </div>
      )}

      {/* Non-review activity — keep existing compact layout */}
      {!hasReview && (
        <div className="py-4 border-b border-border/60 last:border-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link href={`/user/${activity.user.username}`} className="shrink-0">
                <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-cinema-500/40 transition-all">
                  <AvatarImage src={activity.user.avatar ?? undefined} />
                  <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                    {getInitials(activity.user.displayName ?? '')}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <p className="text-sm leading-snug min-w-0">
                <Link
                  href={`/user/${activity.user.username}`}
                  className="font-semibold hover:text-cinema-400 transition-colors"
                >
                  {activity.user.displayName}
                </Link>
                {' '}
                <span className="text-muted-foreground">{label}</span>
                {activity.movie && (
                  <>
                    {' '}
                    <Link
                      href={`/film/${activity.movie.tmdbId}`}
                      className="font-medium hover:text-cinema-400 transition-colors"
                    >
                      {activity.movie.title}
                    </Link>
                  </>
                )}
                {activity.type === 'FOLLOWED_USER' && activity.metadata && (
                  <>
                    {' '}
                    <Link
                      href={`/user/${(activity.metadata as any).targetUsername}`}
                      className="font-medium hover:text-cinema-400 transition-colors"
                    >
                      {(activity.metadata as any).targetUsername}
                    </Link>
                  </>
                )}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
              {formatRelativeTime(activity.createdAt)}
            </span>
          </div>

          {activity.movie && (
            <Link href={`/film/${activity.movie.tmdbId}`} className="inline-block">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative h-20 w-14 overflow-hidden rounded-lg bg-muted shadow-md"
              >
                <MoviePoster
                  poster={activity.movie.poster}
                  title={activity.movie.title}
                  tmdbSize="w154"
                  sizes="56px"
                />
              </motion.div>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
