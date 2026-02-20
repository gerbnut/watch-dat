export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor')
  const limit = 20

  try {
    // Get IDs of users I follow
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)
    followingIds.push(session.user.id) // Include own activity

    const activities = await prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, backdrop: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = activities.length > limit
    const data = hasMore ? activities.slice(0, limit) : activities

    // Enrich review activities
    const reviewIds = data
      .filter((a) => a.reviewId)
      .map((a) => a.reviewId!)

    const reviews = reviewIds.length
      ? await prisma.review.findMany({
          where: { id: { in: reviewIds } },
          include: {
            _count: { select: { likes: true, comments: true } },
          },
        })
      : []

    const reviewMap = new Map(reviews.map((r) => [r.id, r]))

    const enriched = data.map((a) => ({
      ...a,
      review: a.reviewId ? reviewMap.get(a.reviewId) ?? null : null,
    }))

    return NextResponse.json({
      data: enriched,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    })
  } catch (err) {
    console.error('Feed error:', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}
