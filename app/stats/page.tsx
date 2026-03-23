import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatsTab } from '@/components/profile/StatsTab'
import { MonthlyChart } from '@/components/stats/MonthlyChart'
import { GenreChart } from '@/components/stats/GenreChart'
import { RatingChart } from '@/components/stats/RatingChart'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { BarChart3, Film, Star, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Stats',
}

export default async function StatsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      _count: { select: { diaryEntries: true } },
      favoriteMovies: {
        include: { movie: { select: { poster: true } } },
        orderBy: { order: 'asc' },
        take: 5,
      },
    },
  })

  if (!user?.username) redirect('/login')

  const favoritePosterUrls = user.favoriteMovies
    .map((fm) => fm.movie.poster)
    .filter((p): p is string => !!p)
    .map((p) => TMDB_IMAGE.poster(p, 'w154'))
    .filter((url): url is string => !!url)

  const currentYear = new Date().getFullYear()

  // Fetch chart data (same queries as detailed stats page)
  const [
    ratingDistribution,
    genreStats,
    monthlyStats,
    firstEntry,
  ] = await Promise.all([
    prisma.$queryRaw<{ rating_bucket: number; count: number }[]>`
      SELECT ROUND(rating)::int as rating_bucket, COUNT(*)::int as count
      FROM "DiaryEntry"
      WHERE "userId" = ${user.id} AND rating IS NOT NULL
      GROUP BY rating_bucket
      ORDER BY rating_bucket
    `,
    prisma.$queryRaw<{ genre_name: string; count: bigint }[]>`
      SELECT
        genre->>'name' as genre_name,
        COUNT(*)::int as count
      FROM "DiaryEntry" de
      JOIN "Movie" m ON de."movieId" = m.id
      CROSS JOIN LATERAL jsonb_array_elements(m.genres::jsonb) as genre
      WHERE de."userId" = ${user.id}
      GROUP BY genre->>'name'
      ORDER BY count DESC
      LIMIT 12
    `,
    prisma.$queryRaw<{ month: number; count: number; yr: number }[]>`
      SELECT
        EXTRACT(MONTH FROM "watchedDate")::int as month,
        COUNT(*)::int as count,
        EXTRACT(YEAR FROM "watchedDate")::int as yr
      FROM "DiaryEntry"
      WHERE "userId" = ${user.id}
      GROUP BY yr, month
      ORDER BY yr DESC, month
    `,
    prisma.diaryEntry.findFirst({
      where: { userId: user.id },
      orderBy: { watchedDate: 'asc' },
      select: { watchedDate: true },
    }),
  ])

  const genreData = genreStats.map((g) => ({
    genre_name: g.genre_name,
    count: Number(g.count),
  }))

  const currentYearData = monthlyStats.filter((m) => Number(m.yr) === currentYear)
  const chartYear = currentYearData.length > 0
    ? currentYear
    : monthlyStats.length > 0
      ? Number(monthlyStats[0].yr)
      : currentYear
  const monthlyForYear = monthlyStats.filter((m) => Number(m.yr) === chartYear)
  const monthlyData = monthlyForYear.map((m) => ({
    month: Number(m.month),
    count: Number(m.count),
  }))

  const firstYear = firstEntry ? new Date(firstEntry.watchedDate).getFullYear() : currentYear
  const years = Array.from({ length: currentYear - firstYear + 1 }, (_, i) => currentYear - i)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-cinema-400" />
        <h1 className="text-2xl font-bold">Stats</h1>
      </div>

      <StatsTab
        username={user.username}
        wrappedEligible={user._count.diaryEntries >= 10}
        isOwnProfile={true}
        favoritePosterUrls={favoritePosterUrls}
      />

      {/* Films per month chart */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Films per month</h2>
          <span className="text-xs text-muted-foreground">{chartYear}</span>
        </div>
        {monthlyData.some((d) => d.count > 0) ? (
          <MonthlyChart data={monthlyData} />
        ) : (
          <div className="text-center py-6 space-y-1">
            <Film className="h-6 w-6 mx-auto text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">Log films to see your viewing habits over the year</p>
          </div>
        )}
      </div>

      {/* Genre + Rating side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top genres
          </h2>
          {genreData.length > 0 ? (
            <GenreChart data={genreData} />
          ) : (
            <div className="text-center py-6 space-y-1">
              <Film className="h-6 w-6 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">Log films to discover your genre preferences</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Rating distribution
          </h2>
          {ratingDistribution.length > 0 ? (
            <RatingChart data={ratingDistribution.map((r) => ({ rating: Number(r.rating_bucket), _count: { id: Number(r.count) } }))} />
          ) : (
            <div className="text-center py-6 space-y-1">
              <Star className="h-6 w-6 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">Rate films to see your rating patterns</p>
            </div>
          )}
        </div>
      </div>

      {/* Year in review links */}
      {years.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Year in review
          </h2>
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <Link
                key={year}
                href={`/user/${user.username}/year/${year}`}
                className="group flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:border-cinema-500/50 hover:bg-cinema-500/5 transition-all"
              >
                <span>{year}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-cinema-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
