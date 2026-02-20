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
  const username = searchParams.get('username')

  try {
    let userId = session.user.id
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true },
      })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      userId = user.id
    }

    const [watchCount, reviewCount, avgRating, ratingDistribution, genreStats] = await Promise.all([
      prisma.diaryEntry.count({ where: { userId } }),
      prisma.review.count({ where: { userId, text: { not: null } } }),
      prisma.review.aggregate({
        where: { userId, rating: { not: null } },
        _avg: { rating: true },
      }),
      // Rating distribution
      prisma.review.groupBy({
        by: ['rating'],
        where: { userId, rating: { not: null } },
        _count: { id: true },
        orderBy: { rating: 'asc' },
      }),
      // Genre stats — requires parsing JSON genres from movies
      prisma.$queryRaw`
        SELECT
          genre->>'name' as genre_name,
          COUNT(*) as count
        FROM "DiaryEntry" de
        JOIN "Movie" m ON de."movieId" = m.id
        CROSS JOIN LATERAL jsonb_array_elements(m.genres::jsonb) as genre
        WHERE de."userId" = ${userId}
        GROUP BY genre->>'name'
        ORDER BY count DESC
        LIMIT 10
      `,
    ])

    return NextResponse.json({
      watchCount,
      reviewCount,
      avgRating: avgRating._avg.rating,
      ratingDistribution,
      genreStats,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
