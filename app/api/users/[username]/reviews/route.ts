export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor')
  const limit = 20

  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = reviews.length > limit
    const data = hasMore ? reviews.slice(0, limit) : reviews

    return NextResponse.json({
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
