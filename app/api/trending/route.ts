export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { getTrendingMovies, getPopularMovies } from '@/lib/tmdb'
import { prisma } from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { allowed, headers } = rateLimit({
    key: `ip:${getIp(req)}:trending`,
    limit: 30,
    windowSec: 60,
  })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
  }

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'trending'

  try {
    let tmdbData
    if (type === 'popular') {
      tmdbData = await getPopularMovies()
    } else {
      tmdbData = await getTrendingMovies('week')
    }

    // Enrich with community stats
    const tmdbIds = tmdbData.results.slice(0, 20).map((m: any) => m.id)
    const movies = await prisma.movie.findMany({
      where: { tmdbId: { in: tmdbIds } },
      include: {
        _count: { select: { reviews: true, diaryEntries: true } },
      },
    })

    const statsMap = new Map(movies.map((m) => [m.tmdbId, m._count]))

    const enriched = tmdbData.results.slice(0, 20).map((m: any) => ({
      ...m,
      communityStats: statsMap.get(m.id) ?? { reviews: 0, diaryEntries: 0 },
    }))

    return NextResponse.json({ results: enriched })
  } catch (err) {
    console.error('Trending error:', err)
    return NextResponse.json({ error: 'Failed to load trending' }, { status: 500 })
  }
}
