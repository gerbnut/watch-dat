import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { BarChart2, Film, Clock, Star, BookOpen, ArrowRight } from 'lucide-react'
import { BackButton } from '@/components/ui/BackButton'
import { MonthlyChart } from '@/components/stats/MonthlyChart'
import { GenreChart } from '@/components/stats/GenreChart'
import { RatingChart } from '@/components/stats/RatingChart'
import { formatRating } from '@/lib/utils'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `Stats · @${username}` }
}

export default async function StatsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  })
  if (!user) notFound()

  const session = await auth()
  const isOwnProfile = session?.user?.id === user.id

  const currentYear = new Date().getFullYear()

  const [
    watchCount,
    reviewCount,
    avgRatingResult,
    ratingDistribution,
    genreStats,
    monthlyStats,
    totalRuntimeResult,
    firstEntry,
  ] = await Promise.all([
    prisma.diaryEntry.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { userId: user.id, text: { not: null } } }),
    prisma.diaryEntry.aggregate({
      where: { userId: user.id, rating: { not: null } },
      _avg: { rating: true },
    }),
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
    prisma.$queryRaw<{ total_minutes: bigint }[]>`
      SELECT COALESCE(SUM(m.runtime), 0)::bigint as total_minutes
      FROM "DiaryEntry" de
      JOIN "Movie" m ON de."movieId" = m.id
      WHERE de."userId" = ${user.id}
        AND m.runtime IS NOT NULL
    `,
    prisma.diaryEntry.findFirst({
      where: { userId: user.id },
      orderBy: { watchedDate: 'asc' },
      select: { watchedDate: true },
    }),
  ])

  const avgRating = avgRatingResult._avg.rating
  const totalMinutes = Number(totalRuntimeResult[0]?.total_minutes ?? 0)
  const totalHours = Math.floor(totalMinutes / 60)

  const genreData = genreStats.map((g) => ({
    genre_name: g.genre_name,
    count: Number(g.count),
  }))

  // Pick current year first, fall back to most recent year with data
  const currentYearData = monthlyStats.filter((m) => Number(m.yr) === currentYear)
  const chartYear = currentYearData.length > 0
    ? currentYear
    : monthlyStats.length > 0
      ? Number(monthlyStats[0].yr) // sorted DESC, so first is most recent
      : currentYear
  const monthlyForYear = monthlyStats.filter((m) => Number(m.yr) === chartYear)
  const monthlyData = monthlyForYear.map((m) => ({
    month: Number(m.month),
    count: Number(m.count),
  }))

  // Year range for wrap-up links
  const firstYear = firstEntry ? new Date(firstEntry.watchedDate).getFullYear() : currentYear
  const years = Array.from({ length: currentYear - firstYear + 1 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/user/${user.username}`} className="hover:text-foreground transition-colors">
            @{user.username}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5 text-cinema-400" />
            Stats
          </span>
        </div>
      </div>

      {/* Wrapped CTA */}
      {isOwnProfile && watchCount >= 10 && (
        <Link
          href={`/user/${user.username}/wrapped`}
          className="block"
        >
          <div className="rounded-xl bg-gradient-to-r from-cinema-950 via-cinema-900/50 to-cinema-950 border border-cinema-500/20 p-4 flex items-center justify-between hover:border-cinema-500/40 hover:shadow-glow-green-xs transition-all">
            <div>
              <p className="font-bold text-sm">Film Wrapped</p>
              <p className="text-xs text-muted-foreground/60">Your all-time cinema story</p>
            </div>
            <ArrowRight className="h-4 w-4 text-cinema-400" />
          </div>
        </Link>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Film,    label: 'Films watched', value: watchCount.toLocaleString() },
          { icon: Clock,   label: 'Hours watched', value: totalHours > 0 ? totalHours.toLocaleString() : '—' },
          { icon: BookOpen,label: 'Reviews',        value: reviewCount.toLocaleString() },
          { icon: Star,    label: 'Avg rating',     value: avgRating ? avgRating.toFixed(1) : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center space-y-1.5">
            <Icon className="h-5 w-5 mx-auto text-cinema-400" />
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Films this year — monthly chart */}
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
