export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor') // ISO datetime string
  const limit = 20

  const userId = session.user.id

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const ids = [...following.map((f) => f.followingId), userId]

  const activities = await prisma.activity.findMany({
    where: {
      userId: { in: ids },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      movie: { select: { id: true, tmdbId: true, title: true, poster: true, backdrop: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  })

  const hasMore = activities.length > limit
  const items = hasMore ? activities.slice(0, limit) : activities

  const reviewIds = items.filter((a) => a.reviewId).map((a) => a.reviewId!)
  const [reviews, likedReviewData] = await Promise.all([
    reviewIds.length
      ? prisma.review.findMany({
          where: { id: { in: reviewIds } },
          include: { _count: { select: { likes: true, comments: true } } },
        })
      : [],
    reviewIds.length
      ? prisma.like.findMany({
          where: { userId, reviewId: { in: reviewIds } },
          select: { reviewId: true },
        })
      : [],
  ])
  const reviewMap = new Map(reviews.map((r) => [r.id, r]))
  const likedSet = new Set(likedReviewData.map((l) => l.reviewId))

  const result = items.map((a) => ({
    ...a,
    review: a.reviewId
      ? { ...(reviewMap.get(a.reviewId) ?? null), isLiked: likedSet.has(a.reviewId) }
      : null,
  }))

  return NextResponse.json({
    activities: result,
    nextCursor: hasMore ? items[items.length - 1].createdAt.toISOString() : null,
  })
}
