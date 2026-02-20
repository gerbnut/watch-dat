import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor')
  const limit = 20

  try {
    const session = await auth()
    const tmdbId = Number(params.id)
    const movie = await prisma.movie.findUnique({ where: { tmdbId } })
    if (!movie) return NextResponse.json({ data: [], hasMore: false })

    const reviews = await prisma.review.findMany({
      where: { movieId: movie.id, text: { not: null } },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = reviews.length > limit
    const data = hasMore ? reviews.slice(0, limit) : reviews

    // Check likes for current user
    let likedIds = new Set<string>()
    if (session?.user?.id) {
      const likes = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          reviewId: { in: data.map((r) => r.id) },
        },
        select: { reviewId: true },
      })
      likedIds = new Set(likes.map((l) => l.reviewId))
    }

    const result = data.map((r) => ({ ...r, isLiked: likedIds.has(r.id) }))

    return NextResponse.json({
      data: result,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    })
  } catch (err) {
    console.error('Movie reviews error:', err)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
