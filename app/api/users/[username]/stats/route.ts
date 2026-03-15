export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const period = req.nextUrl.searchParams.get('period') ?? 'all'

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()
    let periodStart: Date | null = null
    let weeksInPeriod = 1

    if (period === 'month') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      weeksInPeriod = daysInMonth / 7
    } else if (period === 'year') {
      periodStart = new Date(now.getFullYear(), 0, 1)
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1
      weeksInPeriod = dayOfYear / 7
    } else {
      const first = await prisma.diaryEntry.findFirst({
        where: { userId: user.id },
        orderBy: { watchedDate: 'asc' },
        select: { watchedDate: true },
      })
      if (first) {
        const daysSince = Math.floor((now.getTime() - new Date(first.watchedDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
        weeksInPeriod = Math.max(1, daysSince / 7)
      }
    }

    const dateWhere: any = periodStart ? { watchedDate: { gte: periodStart } } : {}
    const createdWhere: any = periodStart ? { createdAt: { gte: periodStart } } : {}

    const [
      totalFilms,
      rewatchCount,
      reviewStats,
      totalHoursResult,
      allUserCounts,
    ] = await Promise.all([
      prisma.diaryEntry.count({
        where: { userId: user.id, ...dateWhere },
      }),
      prisma.diaryEntry.count({
        where: { userId: user.id, rewatch: true, ...dateWhere },
      }),
      // Review stats: count and word total
      (async () => {
        const reviews = await prisma.review.findMany({
          where: {
            userId: user.id,
            text: { not: null },
            ...createdWhere,
          },
          select: { text: true },
        })
        const reviewCount = reviews.length
        const totalWords = reviews.reduce((sum, r) => {
          return sum + (r.text?.trim().split(/\s+/).filter(Boolean).length ?? 0)
        }, 0)
        return { reviewCount, totalWords }
      })(),
      // Total hours
      periodStart
        ? prisma.$queryRaw<{ total_minutes: bigint }[]>`
            SELECT COALESCE(SUM(m.runtime), 0)::bigint as total_minutes
            FROM "DiaryEntry" de
            JOIN "Movie" m ON de."movieId" = m.id
            WHERE de."userId" = ${user.id} AND m.runtime IS NOT NULL
              AND de."watchedDate" >= ${periodStart}
          `
        : prisma.$queryRaw<{ total_minutes: bigint }[]>`
            SELECT COALESCE(SUM(m.runtime), 0)::bigint as total_minutes
            FROM "DiaryEntry" de
            JOIN "Movie" m ON de."movieId" = m.id
            WHERE de."userId" = ${user.id} AND m.runtime IS NOT NULL
          `,
      // Percentile: all users' diary counts for the period
      periodStart
        ? prisma.$queryRaw<{ userId: string; count: bigint }[]>`
            SELECT "userId", COUNT(*)::bigint as count
            FROM "DiaryEntry"
            WHERE "watchedDate" >= ${periodStart}
            GROUP BY "userId"
          `
        : prisma.$queryRaw<{ userId: string; count: bigint }[]>`
            SELECT "userId", COUNT(*)::bigint as count
            FROM "DiaryEntry"
            GROUP BY "userId"
          `,
    ])

    // Percentile calc
    const sortedCounts = allUserCounts.map(u => Number(u.count)).sort((a, b) => b - a)
    const userRank = sortedCounts.findIndex(c => c <= totalFilms) + 1
    const percentile = sortedCounts.length > 0
      ? Math.max(1, Math.round((userRank / sortedCounts.length) * 100))
      : 100

    const totalMinutes = Number(totalHoursResult[0]?.total_minutes ?? 0)

    return NextResponse.json({
      totalFilms,
      percentile,
      avgPerWeek: weeksInPeriod > 0 ? Math.round((totalFilms / weeksInPeriod) * 10) / 10 : 0,
      rewatchPercent: totalFilms > 0 ? Math.round((rewatchCount / totalFilms) * 100) : 0,
      totalWords: reviewStats.totalWords,
      avgWordsPerReview: reviewStats.reviewCount > 0 ? Math.round(reviewStats.totalWords / reviewStats.reviewCount) : 0,
      reviewCount: reviewStats.reviewCount,
      totalHours: Math.floor(totalMinutes / 60),
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
