'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, Star, Heart, BookOpen, List, UserPlus, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/movies/StarRating'
import { CommentsSection } from '@/components/reviews/CommentsSection'
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
  const Icon = ACTIVITY_ICONS[activity.type] ?? Eye
  const label = ACTIVITY_LABELS[activity.type] ?? activity.type
  const posterUrl = activity.movie?.poster ? TMDB_IMAGE.poster(activity.movie.poster, 'w185') : null

  // Like state — starts from server-provided isLiked, falls back to false
  const [likeCount, setLikeCount] = useState<number>(activity.review?._count?.likes ?? 0)
  const [isLiked, setIsLiked] = useState<boolean>(activity.review?.isLiked ?? false)
  const [liking, setLiking] = useState(false)

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
    setLikeCount((c) => newLiked ? c + 1 : c - 1)
    try {
      const res = await fetch(`/api/reviews/${activity.review.id}/like`, { method: 'POST' })
      const data = await res.json()
      setIsLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch {
      setIsLiked(!newLiked)
      setLikeCount((c) => !newLiked ? c + 1 : c - 1)
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className="flex gap-3 py-4 border-b border-border last:border-0 animate-fade-in">
      <Link href={`/user/${activity.user.username}`}>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={activity.user.avatar ?? undefined} />
          <AvatarFallback className="text-xs">{getInitials(activity.user.displayName)}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-snug">
            <Link href={`/user/${activity.user.username}`} className="font-semibold hover:underline">
              {activity.user.displayName}
            </Link>
            {' '}
            <span className="text-muted-foreground">{label}</span>
            {activity.movie && (
              <>
                {' '}
                <Link href={`/film/${activity.movie.tmdbId}`} className="font-medium hover:underline">
                  {activity.movie.title}
                </Link>
              </>
            )}
            {activity.type === 'FOLLOWED_USER' && activity.metadata && (
              <>
                {' '}
                <Link
                  href={`/user/${(activity.metadata as any).targetUsername}`}
                  className="font-medium hover:underline"
                >
                  {(activity.metadata as any).targetUsername}
                </Link>
              </>
            )}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(activity.createdAt)}</span>
        </div>

        {/* Review content */}
        {activity.review && (
          <div className="rounded-md border bg-card p-3 space-y-2">
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

            {/* Interactions */}
            <div className="flex items-center gap-4 pt-1 border-t border-border/60">
              <button
                onClick={handleLike}
                disabled={liking}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-all',
                  isLiked ? 'text-cinema-400' : 'text-muted-foreground hover:text-cinema-400',
                  liking && 'scale-110'
                )}
              >
                <Heart className={cn('h-4 w-4 transition-transform duration-200', isLiked && 'fill-current', liking && 'scale-125')} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <CommentsSection
                reviewId={activity.review.id}
                initialCount={activity.review._count?.comments ?? 0}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        )}

        {/* Movie poster strip */}
        {activity.movie && posterUrl && !activity.review && (
          <Link href={`/film/${activity.movie.tmdbId}`}>
            <div className="relative h-20 w-14 overflow-hidden rounded bg-muted hover:opacity-80 transition-opacity">
              <Image src={posterUrl} alt={activity.movie.title} fill className="object-cover" sizes="56px" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
