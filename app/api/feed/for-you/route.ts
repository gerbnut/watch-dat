export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()

  const url = new URL(req.url)
  const skip = parseInt(url.searchParams.get('skip') ?? '0', 10)
  const limit = 20

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Get popular reviews from last 30 days with text or rating
  let reviews = await prisma.review.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      OR: [{ text: { not: null } }, { rating: { not: null } }],
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      movie: { select: { id: true, tmdbId: true, title: true, poster: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { likes: { _count: 'desc' } },
    skip,
    take: limit + 1,
  })

  // Fall back to all-time popular if fewer than limit results
  if (reviews.length < limit) {
    reviews = await prisma.review.findMany({
      where: {
        OR: [{ text: { not: null } }, { rating: { not: null } }],
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { likes: { _count: 'desc' } },
      skip,
      take: limit + 1,
    })
  }

  const hasMore = reviews.length > limit
  const items = hasMore ? reviews.slice(0, limit) : reviews

  // Get liked status for logged-in users
  let likedSet = new Set<string>()
  if (session?.user?.id) {
    const likedData = await prisma.like.findMany({
      where: { userId: session.user.id, reviewId: { in: items.map((r) => r.id) } },
      select: { reviewId: true },
    })
    likedSet = new Set(likedData.map((l) => l.reviewId))
  }

  // Convert reviews to activity shape for reuse in ActivityFeedItem
  const activities = items.map((review) => ({
    id: `foryou-${review.id}`,
    userId: review.userId,
    type: 'REVIEWED' as const,
    movieId: review.movieId,
    reviewId: review.id,
    listId: null,
    metadata: null,
    createdAt: review.createdAt,
    user: review.user,
    movie: review.movie,
    review: {
      ...review,
      isLiked: likedSet.has(review.id),
    },
  }))

  return NextResponse.json({
    activities,
    nextSkip: hasMore ? skip + limit : null,
  })
}
