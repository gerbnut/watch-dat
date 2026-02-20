import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Film, Clock, Star, RotateCcw, Calendar } from 'lucide-react'
import { MonthlyChart } from '@/components/stats/MonthlyChart'
import { GenreChart } from '@/components/stats/GenreChart'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { formatDate } from '@/lib/utils'

export async function generateMetadata({ params }: { params: { username: string; year: string } }): Promise<Metadata> {
  return { title: `${params.year} Wrapped · @${params.username}` }
}

export default async function YearWrappedPage({
  params,
}: {
  params: { username: string; year: string }
}) {
  const year = Number(params.year)
  if (isNaN(year) || year < 1900 || year > 2100) notFound()

  const user = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: { id: true, username: true, displayName: true },
  })
  if (!user) notFound()

  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`)
  const yearEnd   = new Date(`${year}-12-31T23:59:59.999Z`)

  const [
    yearCount,
    rewatchCount,
    avgRatingResult,
    topFilms,
    firstFilm,
    lastFilm,
    monthlyStats,
    genreStats,
    totalRuntimeResult,
    // Check adjacent years have data
    prevYearCount,
    nextYearCount,
  ] = await Promise.all([
    prisma.diaryEntry.count({
      where: { userId: user.id, watchedDate: { gte: yearStart, lte: yearEnd } },
    }),
    prisma.diaryEntry.count({
      where: { userId: user.id, rewatch: true, watchedDate: { gte: yearStart, lte: yearEnd } },
    }),
    prisma.diaryEntry.aggregate({
      where: { userId: user.id, rating: { not: null }, watchedDate: { gte: yearStart, lte: yearEnd } },
      _avg: { rating: true },
    }),
    prisma.diaryEntry.findMany({
      where: { userId: user.id, rating: { not: null }, watchedDate: { gte: yearStart, lte: yearEnd } },
      orderBy: { rating: 'desc' },
      take: 8,
      include: {
        movie: { select: { tmdbId: true, title: true, poster: true, releaseDate: true } },
      },
    }),
    prisma.diaryEntry.findFirst({
      where: { userId: user.id, watchedDate: { gte: yearStart, lte: yearEnd } },
      orderBy: { watchedDate: 'asc' },
      include: { movie: { select: { tmdbId: true, title: true, poster: true } } },
    }),
    prisma.diaryEntry.findFirst({
      where: { userId: user.id, watchedDate: { gte: yearStart, lte: yearEnd } },
      orderBy: { watchedDate: 'desc' },
      include: { movie: { select: { tmdbId: true, title: true, poster: true } } },
    }),
    prisma.$queryRaw<{ month: number; count: number }[]>`
      SELECT
        EXTRACT(MONTH FROM "watchedDate")::int as month,
        COUNT(*)::int as count
      FROM "DiaryEntry"
      WHERE "userId" = ${user.id}
        AND "watchedDate" >= ${yearStart}
        AND "watchedDate" <= ${yearEnd}
      GROUP BY month
      ORDER BY month
    `,
    prisma.$queryRaw<{ genre_name: string; count: bigint }[]>`
      SELECT
        genre->>'name' as genre_name,
        COUNT(*)::int as count
      FROM "DiaryEntry" de
      JOIN "Movie" m ON de."movieId" = m.id
      CROSS JOIN LATERAL jsonb_array_elements(m.genres::jsonb) as genre
      WHERE de."userId" = ${user.id}
        AND de."watchedDate" >= ${yearStart}
        AND de."watchedDate" <= ${yearEnd}
      GROUP BY genre->>'name'
      ORDER BY count DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ total_minutes: bigint }[]>`
      SELECT COALESCE(SUM(m.runtime), 0)::bigint as total_minutes
      FROM "DiaryEntry" de
      JOIN "Movie" m ON de."movieId" = m.id
      WHERE de."userId" = ${user.id}
        AND de."watchedDate" >= ${yearStart}
        AND de."watchedDate" <= ${yearEnd}
        AND m.runtime IS NOT NULL
    `,
    prisma.diaryEntry.count({
      where: {
        userId: user.id,
        watchedDate: {
          gte: new Date(`${year - 1}-01-01T00:00:00.000Z`),
          lte: new Date(`${year - 1}-12-31T23:59:59.999Z`),
        },
      },
    }),
    prisma.diaryEntry.count({
      where: {
        userId: user.id,
        watchedDate: {
          gte: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          lte: new Date(`${year + 1}-12-31T23:59:59.999Z`),
        },
      },
    }),
  ])

  if (yearCount === 0) notFound()

  const avgRating = avgRatingResult._avg.rating
  const totalMinutes = Number(totalRuntimeResult[0]?.total_minutes ?? 0)
  const totalHours = Math.floor(totalMinutes / 60)

  const monthlyData = monthlyStats.map((m) => ({ month: Number(m.month), count: Number(m.count) }))
  const genreData = genreStats.map((g) => ({ genre_name: g.genre_name, count: Number(g.count) }))

  const peakMonth = monthlyData.reduce((a, b) => (a.count >= b.count ? a : b), { month: 0, count: 0 })
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/user/${user.username}/stats`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All stats
        </Link>
        <div className="flex items-center gap-3">
          {prevYearCount > 0 && (
            <Link
              href={`/user/${user.username}/year/${year - 1}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-cinema-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {year - 1}
            </Link>
          )}
          {nextYearCount > 0 && (
            <Link
              href={`/user/${user.username}/year/${year + 1}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-cinema-400 transition-colors"
            >
              {year + 1}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-cinema-950/80 via-cinema-900/20 to-transparent" />
        <div className="relative z-10 px-8 py-10 space-y-1">
          <p className="text-sm font-medium text-cinema-400 uppercase tracking-widest">
            @{user.username}
          </p>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-foreground">
            {year}
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            {yearCount.toLocaleString()} film{yearCount !== 1 ? 's' : ''} watched
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Film,       label: 'Films',     value: yearCount.toLocaleString() },
          { icon: Clock,      label: 'Hours',     value: totalHours > 0 ? totalHours.toLocaleString() : '—' },
          { icon: Star,       label: 'Avg rating', value: avgRating ? avgRating.toFixed(1) : '—' },
          { icon: RotateCcw,  label: 'Rewatches', value: rewatchCount.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center space-y-1.5">
            <Icon className="h-4 w-4 mx-auto text-cinema-400" />
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly activity */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold">Month by month</h2>
          {peakMonth.count > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Most active</p>
              <p className="text-sm font-semibold text-cinema-400">
                {MONTH_NAMES[peakMonth.month - 1]} · {peakMonth.count} films
              </p>
            </div>
          )}
        </div>
        <MonthlyChart data={monthlyData} />
      </div>

      {/* Top rated films */}
      {topFilms.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Your favorites</h2>
          <div className="flex flex-wrap gap-3">
            {topFilms.map((entry) => (
              <Link key={entry.id} href={`/film/${entry.movie.tmdbId}`} className="group">
                <div className="relative w-24 overflow-hidden rounded-lg shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-glow-green aspect-[2/3] bg-muted">
                  {entry.movie.poster ? (
                    <Image
                      src={TMDB_IMAGE.poster(entry.movie.poster, 'w185')!}
                      alt={entry.movie.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  {entry.rating && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
                      <span className="text-[10px] font-bold text-cinema-400">
                        {entry.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      {genreData.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Top genres</h2>
          <GenreChart data={genreData} limit={5} />
        </div>
      )}

      {/* First & last film */}
      {(firstFilm || lastFilm) && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'First film', entry: firstFilm },
            { label: 'Last film',  entry: lastFilm  },
          ].map(({ label, entry }) =>
            entry ? (
              <Link key={label} href={`/film/${entry.movie.tmdbId}`}>
                <div className="rounded-xl border bg-card p-4 flex gap-3 items-center hover:bg-accent transition-colors">
                  <div className="relative w-10 shrink-0 overflow-hidden rounded bg-muted aspect-[2/3]">
                    {entry.movie.poster && (
                      <Image
                        src={TMDB_IMAGE.poster(entry.movie.poster, 'w185')!}
                        alt={entry.movie.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium truncate">{entry.movie.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.watchedDate, 'd MMM')}
                    </p>
                  </div>
                </div>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
