import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getOrCacheMovie } from '@/lib/tmdb'
import { z } from 'zod'

const schema = z.object({
  tmdbId: z.number().int().positive(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get('cursor')
  const limit = 30

  try {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        movie: {
          select: {
            id: true,
            tmdbId: true,
            title: true,
            poster: true,
            releaseDate: true,
            genres: true,
            directors: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items

    return NextResponse.json({
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load watchlist' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid tmdbId' }, { status: 400 })
    }

    const movie = await getOrCacheMovie(parsed.data.tmdbId)

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
    })

    if (existing) {
      await prisma.watchlistItem.delete({ where: { id: existing.id } })
      return NextResponse.json({ added: false })
    } else {
      await prisma.watchlistItem.create({
        data: { userId: session.user.id, movieId: movie.id },
      })
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          type: 'ADDED_TO_WATCHLIST',
          movieId: movie.id,
        },
      })
      return NextResponse.json({ added: true })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update watchlist' }, { status: 500 })
  }
}
