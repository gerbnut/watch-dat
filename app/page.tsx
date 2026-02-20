import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ActivityFeedItem } from '@/components/feed/ActivityFeedItem'
import { MovieCard } from '@/components/movies/MovieCard'
import { Button } from '@/components/ui/button'
import { getSimilarMovies, TMDB_IMAGE } from '@/lib/tmdb'
import Link from 'next/link'
import Image from 'next/image'
import { Film, TrendingUp, Star, Users, Sparkles } from 'lucide-react'

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

async function getHomeFeed(userId: string) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const ids = [...following.map((f) => f.followingId), userId]

  const activities = await prisma.activity.findMany({
    where: { userId: { in: ids } },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      movie: { select: { id: true, tmdbId: true, title: true, poster: true, backdrop: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const reviewIds = activities.filter((a) => a.reviewId).map((a) => a.reviewId!)
  const [reviews, likedReviewData] = await Promise.all([
    reviewIds.length
      ? prisma.review.findMany({
          where: { id: { in: reviewIds } },
          include: { _count: { select: { likes: true, comments: true } } },
        })
      : [],
    reviewIds.length
      ? prisma.like.findMany({
          where: { userId, reviewId: { in: reviewIds } },
          select: { reviewId: true },
        })
      : [],
  ])
  const reviewMap = new Map(reviews.map((r) => [r.id, r]))
  const likedSet = new Set(likedReviewData.map((l) => l.reviewId))

  return activities.map((a) => ({
    ...a,
    review: a.reviewId
      ? { ...(reviewMap.get(a.reviewId) ?? null), isLiked: likedSet.has(a.reviewId) }
      : null,
  }))
}

export default async function HomePage() {
  const session = await auth()
  const trending = await getTrendingFromTMDB()

  if (!session?.user) {
    // Landing page for logged-out users
    return (
      <div className="space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cinema-950 via-cinema-900/30 to-film-950 py-12 sm:py-20 px-5 sm:px-8 text-center">
          <div className="absolute inset-0 opacity-20">
            <div className="flex gap-1 h-full">
              {trending.slice(0, 8).map((m: any) => (
                m.backdrop_path && (
                  <div key={m.id} className="relative flex-1">
                    <Image
                      src={TMDB_IMAGE.backdrop(m.backdrop_path, 'w780')!}
                      alt={m.title}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                )
              ))}
            </div>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-cinema-500/20 border border-cinema-500/30 px-4 py-1.5 text-sm text-cinema-300">
              <Film className="h-4 w-4" /> Your digital film diary
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Track every film<br />
              <span className="text-cinema-400">you've ever watched.</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Rate, review, and discover films with a community of cinephiles.
              Build your diary, curate lists, and see what your friends are watching.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/register">
                <Button variant="cinema" size="lg" className="sm:!h-12 sm:!px-8 sm:!text-base">
                  Start your diary
                </Button>
              </Link>
              <Link href="/films">
                <Button variant="outline" size="lg" className="sm:!h-12 sm:!px-8 sm:!text-base">
                  Explore films
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Film, label: 'Films logged', value: '10k+' },
            { icon: Star, label: 'Reviews written', value: '2.5k+' },
            { icon: Users, label: 'Cinephiles', value: '500+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg border bg-card p-6">
              <Icon className="h-6 w-6 mx-auto mb-2 text-cinema-400" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-cinema-400" />
            <h2 className="text-lg font-semibold">Trending this week</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {trending.map((movie: any) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.id}
                title={movie.title}
                poster={movie.poster_path}
                releaseDate={movie.release_date}
                rating={movie.vote_average}
                size="md"
                className="shrink-0 snap-start"
              />
            ))}
          </div>
        </section>
      </div>
    )
  }

  // Authenticated home — fetch feed + most recent diary entry in parallel
  const [feedResult, recentEntryResult] = await Promise.allSettled([
    getHomeFeed(session.user.id),
    prisma.diaryEntry.findFirst({
      where: { userId: session.user.id },
      orderBy: { watchedDate: 'desc' },
      include: { movie: { select: { tmdbId: true, title: true } } },
    }),
  ])
  const feed = feedResult.status === 'fulfilled' ? feedResult.value : []
  const recentEntry = recentEntryResult.status === 'fulfilled' ? recentEntryResult.value : null

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
      {/* Main feed */}
      <div className="lg:col-span-2 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Your feed</h1>
        </div>

        {feed.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center space-y-4">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium">Your feed is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Follow other cinephiles to see their activity here
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline" size="sm">Find people to follow</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border bg-card px-4">
            {feed.map((activity) => (
              <ActivityFeedItem
                key={activity.id}
                activity={activity as any}
                currentUserId={session.user.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {/* Because you watched X */}
        {recommendations.length > 0 && (
          <div className="rounded-xl border bg-card p-4">
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
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-cinema-400" />
            <h2 className="text-sm font-semibold">Trending</h2>
          </div>
          <div className="space-y-2">
            {trending.slice(0, 5).map((movie: any, i: number) => (
              <Link key={movie.id} href={`/film/${movie.id}`} className="flex items-center gap-3 hover:bg-accent/50 rounded-md p-1.5 transition-colors">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="relative h-9 w-6 shrink-0 overflow-hidden rounded">
                  {movie.poster_path && (
                    <Image
                      src={TMDB_IMAGE.poster(movie.poster_path, 'w185')!}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  )}
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
