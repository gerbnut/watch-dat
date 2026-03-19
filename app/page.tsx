import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { FeedTabs } from '@/components/feed/FeedTabs'
import { MovieCard } from '@/components/movies/MovieCard'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { getSimilarMovies } from '@/lib/tmdb'
import Link from 'next/link'
import { TrendingUp, Sparkles } from 'lucide-react'
import { LandingHero } from '@/components/landing/LandingHero'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FriendSearch } from '@/components/feed/FriendSearch'

async function getTrendingFromTMDB() {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.results?.slice(0, 10) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const session = await auth()
  const trending = await getTrendingFromTMDB()

  if (!session?.user) {
    return (
      <div className="space-y-16">
        <LandingHero />

        {/* Trending */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-cinema-400" />
            <h2 className="text-lg font-semibold">Trending this week</h2>
          </div>
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {trending.map((movie: any, i: number) => (
                <MovieCard
                  key={movie.id}
                  tmdbId={movie.id}
                  title={movie.title}
                  poster={movie.poster_path}
                  releaseDate={movie.release_date}
                  rating={movie.vote_average}
                  size="md"
                  priority={i < 3}
                  className="shrink-0 snap-start"
                />
              ))}
            </div>
            <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        </section>
      </div>
    )
  }

  // Authenticated home — fetch most recent diary entry for recommendations
  const recentEntry = await prisma.diaryEntry.findFirst({
    where: { userId: session.user.id },
    orderBy: { watchedDate: 'desc' },
    include: { movie: { select: { tmdbId: true, title: true } } },
  }).catch(() => null)

  // Recommendations: similar films to most recently watched, excluding already-seen
  let recommendations: any[] = []
  let basedOnTitle = ''

  if (recentEntry?.movie) {
    try {
      const [similar, watched] = await Promise.all([
        getSimilarMovies(recentEntry.movie.tmdbId),
        prisma.diaryEntry.findMany({
          where: { userId: session.user.id },
          select: { movie: { select: { tmdbId: true } } },
          take: 100,
        }),
      ])
      const watchedSet = new Set(watched.map((e) => e.movie.tmdbId))
      recommendations = (similar.results ?? [])
        .filter((m: any) => !watchedSet.has(m.id))
        .slice(0, 12)
      basedOnTitle = recentEntry.movie.title
    } catch {
      // silent fail — recommendations are non-critical
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Friend search — mobile only, above feed */}
      <div className="lg:hidden lg:col-span-2">
        <div className="rounded-2xl border border-white/[0.04] bg-card/50 p-4">
          <h2 className="text-sm font-semibold mb-2">Find friends</h2>
          <FriendSearch />
        </div>
      </div>

      {/* Main feed with tabs */}
      <div className="lg:col-span-2">
        <ErrorBoundary label="feed">
          <FeedTabs currentUserId={session.user.id} />
        </ErrorBoundary>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {/* Friend search — desktop sidebar */}
        <div className="hidden lg:block rounded-2xl border border-white/[0.04] bg-card/50 p-4">
          <h2 className="text-sm font-semibold mb-2">Find friends</h2>
          <FriendSearch />
        </div>

        {/* Because you watched X */}
        {recommendations.length > 0 && (
          <div className="rounded-2xl border border-white/[0.04] bg-card/50 p-4">
            <div className="flex items-start gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-cinema-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight">Because you watched</h2>
                <p className="text-xs text-muted-foreground truncate">{basedOnTitle}</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {recommendations.map((movie: any) => (
                <MovieCard
                  key={movie.id}
                  tmdbId={movie.id}
                  title={movie.title}
                  poster={movie.poster_path}
                  releaseDate={movie.release_date}
                  rating={movie.vote_average}
                  size="xs"
                  className="shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Trending */}
        <div className="rounded-2xl border border-white/[0.04] bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-cinema-400" />
            <h2 className="text-sm font-semibold">Trending</h2>
          </div>
          <div className="space-y-2">
            {trending.slice(0, 5).map((movie: any, i: number) => (
              <Link key={movie.id} href={`/film/${movie.id}`} className="flex items-center gap-3 hover:bg-white/[0.04] rounded-lg p-1.5 transition-colors">
                <span className="text-xs text-muted-foreground/60 w-4 tabular-nums">{i + 1}</span>
                <div className="relative h-9 w-6 shrink-0 overflow-hidden rounded ring-1 ring-inset ring-white/[0.06]">
                  <MoviePoster
                    poster={movie.poster_path}
                    title={movie.title}
                    tmdbSize="w92"
                    sizes="24px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{movie.title}</p>
                  {movie.release_date && (
                    <p className="text-xs text-muted-foreground">{new Date(movie.release_date).getFullYear()}</p>
                  )}
                </div>
                {movie.vote_average > 0 && (
                  <span className="text-xs text-cinema-400 font-semibold shrink-0">
                    ★ {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <Link href="/films" className="block mt-3 text-xs text-cinema-400 hover:underline text-center">
            View all trending →
          </Link>
        </div>
      </aside>
    </div>
  )
}
