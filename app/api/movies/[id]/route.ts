import { NextRequest, NextResponse } from 'next/server'
import { getOrCacheMovie } from '@/lib/tmdb'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
  }

  try {
    const session = await auth()
    const movie = await getOrCacheMovie(tmdbId)

    // Aggregate stats
    const [reviewStats, diaryCount] = await Promise.all([
      prisma.review.aggregate({
        where: { movieId: movie.id, rating: { not: null } },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.diaryEntry.count({ where: { movieId: movie.id } }),
    ])

    let userReview = null
    let isOnWatchlist = false

    if (session?.user?.id) {
      ;[userReview, isOnWatchlist] = await Promise.all([
        prisma.review.findUnique({
          where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
        }),
        prisma.watchlistItem
          .findUnique({
            where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
          })
          .then(Boolean),
      ])
    }

    return NextResponse.json({
      ...movie,
      avgRating: reviewStats._avg.rating,
      reviewCount: reviewStats._count.id,
      watchCount: diaryCount,
      userReview,
      isOnWatchlist,
    })
  } catch (err) {
    console.error('Movie detail error:', err)
    return NextResponse.json({ error: 'Failed to load movie' }, { status: 500 })
  }
}
