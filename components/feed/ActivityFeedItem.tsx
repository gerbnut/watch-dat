'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, Star, Heart, BookOpen, List, UserPlus, Bookmark, MessageSquare, Share2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/movies/StarRating'
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
}

export function ActivityFeedItem({ activity, currentUserId }: ActivityFeedItemProps) {
  const label = ACTIVITY_LABELS[activity.type] ?? activity.type
  const posterUrl = activity.movie?.poster ? TMDB_IMAGE.poster(activity.movie.poster, 'w185') : null
  const [imgLoaded, setImgLoaded] = useState(false)

  const [likeCount, setLikeCount] = useState<number>(activity.review?._count?.likes ?? 0)
  const [isLiked, setIsLiked] = useState<boolean>(activity.review?.isLiked ?? false)
  const [liking, setLiking] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  async function handleLike() {
    if (!currentUserId || !activity.review?.id) {
      if (!currentUserId) {
        const { toast } = await import('@/hooks/use-toast')
        toast({ title: 'Sign in to like', description: 'Create an account to like reviews.' })
      }
      return
    }
    if (liking) return
    setLiking(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount((c) => (newLiked ? c + 1 : c - 1))
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

  return (
    <div className="py-4 border-b border-border/60 last:border-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/user/${activity.user.username}`} className="shrink-0">
            <Avatar className="h-9 w-9 ring-2 ring-transparent hover:ring-cinema-500/40 transition-all">
              <AvatarImage src={activity.user.avatar ?? undefined} />
              <AvatarFallback className="text-xs bg-cinema-900 text-cinema-300">
                {getInitials(activity.user.displayName)}
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

      {/* Review card — tappable on mobile, rich on desktop */}
      {hasReview && (
        <div className="relative rounded-xl border bg-card overflow-hidden group hover:border-border/80 transition-colors">
          {/* Full-card tap target — goes to review page */}
          <Link
            href={`/review/${activity.review.id}`}
            className="absolute inset-0 z-0"
            aria-label={`View review of ${activity.movie?.title ?? 'film'}`}
            tabIndex={-1}
          />

          {/* Review content */}
          <div className="relative z-10 flex gap-3 p-3 pointer-events-none">
            {posterUrl && activity.movie && (
              <Link
                href={`/film/${activity.movie.tmdbId}`}
                className="shrink-0 pointer-events-auto"
                tabIndex={-1}
              >
                <div className="relative w-[52px] h-[78px] rounded-md overflow-hidden bg-muted">
                  <Image
                    src={posterUrl}
                    alt={activity.movie.title}
                    fill
                    className={cn(
                      'object-cover transition-opacity duration-300',
                      imgLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    sizes="52px"
                    onLoad={() => setImgLoaded(true)}
                  />
                  {!imgLoaded && <div className="absolute inset-0 skeleton" />}
                </div>
              </Link>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              {activity.review.rating && (
                <StarRating value={activity.review.rating} readOnly size="sm" showValue />
              )}
              {activity.review.text && (
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed line-clamp-4">
                  <ReactMarkdown>{activity.review.text}</ReactMarkdown>
                </div>
              )}
              {activity.review.liked && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <Heart className="h-3 w-3 fill-current" /> Loved it
                </div>
              )}
              {!activity.review.rating && !activity.review.text && !activity.review.liked && (
                <p className="text-sm text-muted-foreground italic">No review text</p>
              )}
            </div>
          </div>

          {/* Action bar — always interactive (z-20 above the tap overlay) */}
          <div className="relative z-20 flex items-center gap-1 px-3 py-2 border-t border-border/50">
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

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto touch-manipulation"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-xs hidden sm:inline">Share</span>
            </button>
          </div>

          {/* Comments */}
          {commentsOpen && (
            <div className="relative z-20 border-t border-border/50 px-3 py-3">
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

      {/* Non-review activity poster */}
      {!hasReview && activity.movie && posterUrl && (
        <Link href={`/film/${activity.movie.tmdbId}`} className="inline-block">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative h-20 w-14 overflow-hidden rounded-lg bg-muted shadow-md"
          >
            <Image
              src={posterUrl}
              alt={activity.movie.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          </motion.div>
        </Link>
      )}
    </div>
  )
}
