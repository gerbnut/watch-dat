export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// GET /api/movies/following-ratings?tmdbIds=123,456,789
// Returns avg rating from people the current user follows, per movie
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({})
  }

  const raw = req.nextUrl.searchParams.get('tmdbIds')
  if (!raw) return NextResponse.json({})

  const tmdbIds = raw.split(',').map(Number).filter((n) => !isNaN(n)).slice(0, 30)
  if (tmdbIds.length === 0) return NextResponse.json({})

  try {
    // Get IDs of people the user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)
    if (followingIds.length === 0) return NextResponse.json({})

    // Get reviews from followed users for these movies
    const reviews = await prisma.review.findMany({
      where: {
        userId: { in: followingIds },
        movie: { tmdbId: { in: tmdbIds } },
        rating: { not: null },
      },
      select: {
        rating: true,
        movie: { select: { tmdbId: true } },
      },
    })

    // Aggregate by tmdbId
    const map: Record<number, { sum: number; count: number }> = {}
    for (const r of reviews) {
      const id = r.movie.tmdbId
      if (!map[id]) map[id] = { sum: 0, count: 0 }
      map[id].sum += r.rating!
      map[id].count++
    }

    const result: Record<number, { avg: number; count: number }> = {}
    for (const [id, { sum, count }] of Object.entries(map)) {
      result[Number(id)] = { avg: Math.round((sum / count) * 10) / 10, count }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Following ratings error:', err)
    return NextResponse.json({})
  }
}
