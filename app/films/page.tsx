export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import {
  getTrendingMovies,
  getPopularMovies,
  getNowPlayingMovies,
  getTopRatedMovies,
  discoverMovies,
} from '@/lib/tmdb'
import { getUserTopGenres } from '@/lib/user-genres'
import { MovieScrollRow } from '@/components/movies/MovieScrollRow'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import {
  TrendingUp,
  Star,
  Clapperboard,
  Shuffle,
  Sparkles,
  Heart,
  Skull,
  Brain,
  Compass,
  BookOpen,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Films' }

type Tab = 'popular' | 'new' | 'top-rated' | 'for-you'

export default async function FilmsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const session = await auth()
  const userId = session?.user?.id

  const tab: Tab =
    rawTab === 'new' ? 'new'
    : rawTab === 'top-rated' ? 'top-rated'
    : rawTab === 'for-you' && userId ? 'for-you'
    : 'popular'

  const tabs = [
    { id: 'popular' as Tab, label: 'Popular', href: '/films' },
    { id: 'new' as Tab, label: 'New Releases', href: '/films?tab=new' },
    { id: 'top-rated' as Tab, label: 'Top Rated', href: '/films?tab=top-rated' },
    ...(userId ? [{ id: 'for-you' as Tab, label: 'For You', href: '/films?tab=for-you' }] : []),
  ]

  let content: React.ReactNode

  if (tab === 'popular') {
    const [trending, popular, feelGood, crimeMystery, mindBending, epicAdventures, trueStories] =
      await Promise.all([
        getTrendingMovies('week'),
        getPopularMovies(),
        discoverMovies({ withGenres: '35,10749', sortBy: 'vote_average.desc', minVotes: 500 }),
        discoverMovies({ withGenres: '80,9648', sortBy: 'popularity.desc' }),
        discoverMovies({ withGenres: '878,53', sortBy: 'popularity.desc' }),
        discoverMovies({ withGenres: '12,14', sortBy: 'popularity.desc' }),
        discoverMovies({ withGenres: '36,99', sortBy: 'popularity.desc', minVotes: 100 }),
      ])

    const recentReviews = await prisma.review.findMany({
      where: { text: { not: null }, rating: { gte: 7 } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    content = (
      <div className="space-y-8">
        <MovieScrollRow
          title="Trending This Week"
          icon={TrendingUp}
          movies={trending.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/trending?title=Trending+This+Week"
        />
        <MovieScrollRow
          title="Popular Right Now"
          icon={Star}
          movies={popular.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Feel Good Movies"
          icon={Heart}
          movies={feelGood.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/35,10749?title=Feel+Good+Movies"
        />
        <MovieScrollRow
          title="Crime & Mystery"
          icon={Skull}
          movies={crimeMystery.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/80,9648?title=Crime+%26+Mystery"
        />
        <MovieScrollRow
          title="Mind-Bending"
          icon={Brain}
          movies={mindBending.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/878,53?title=Mind-Bending"
        />
        <MovieScrollRow
          title="Epic Adventures"
          icon={Compass}
          movies={epicAdventures.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/12,14?title=Epic+Adventures"
        />
        <MovieScrollRow
          title="True Stories"
          icon={BookOpen}
          movies={trueStories.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/36,99?title=True+Stories"
        />

        {recentReviews.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-cinema-400" />
              <h2 className="text-lg font-semibold">What People Are Saying</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review as any}
                  showMovie
                  currentUserId={userId}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  } else if (tab === 'new') {
    const nowPlaying = await getNowPlayingMovies()
    content = (
      <MovieScrollRow
        title="Now Playing"
        icon={Clapperboard}
        movies={nowPlaying.results?.slice(0, 20) ?? []}
      />
    )
  } else if (tab === 'top-rated') {
    const [topRated, criticallyAcclaimed] = await Promise.all([
      getTopRatedMovies(),
      discoverMovies({ sortBy: 'vote_average.desc', minVotes: 1000 }),
    ])
    content = (
      <div className="space-y-8">
        <MovieScrollRow
          title="All-Time Greats"
          icon={Star}
          movies={topRated.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Critically Acclaimed"
          icon={Star}
          movies={criticallyAcclaimed.results?.slice(0, 20) ?? []}
        />
      </div>
    )
  } else {
    // For You tab (authenticated)
    const topGenres = await getUserTopGenres(userId!, 5)

    if (topGenres.length === 0) {
      content = (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <Sparkles className="h-12 w-12 text-cinema-400/40" />
          <h2 className="text-xl font-semibold">No personalized picks yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Log some films to get recommendations tailored to your taste.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium bg-cinema-500/10 text-cinema-400 border border-cinema-500/20 hover:bg-cinema-500/20 transition-colors"
          >
            <Search className="h-4 w-4" /> Find films to log
          </Link>
        </div>
      )
    } else {
      const genreResults = await Promise.all(
        topGenres.map((g) => discoverMovies({ withGenres: g.id }))
      )

      const [feelGood, mindBending, recentReviews] = await Promise.all([
        discoverMovies({ withGenres: '35,10749', sortBy: 'vote_average.desc', minVotes: 500 }),
        discoverMovies({ withGenres: '878,53', sortBy: 'popularity.desc' }),
        prisma.review.findMany({
          where: { text: { not: null }, rating: { gte: 7 } },
          orderBy: { createdAt: 'desc' },
          take: 4,
          include: {
            user: { select: { id: true, username: true, displayName: true, avatar: true } },
            movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
            _count: { select: { likes: true, comments: true } },
          },
        }),
      ])

      content = (
        <div className="space-y-8">
          {topGenres.map((genre, i) => (
            <MovieScrollRow
              key={genre.id}
              title={`Because you love ${genre.name}`}
              icon={Sparkles}
              movies={genreResults[i].results?.slice(0, 20) ?? []}
              seeMoreHref={`/films/genre/${genre.id}?title=Because+you+love+${encodeURIComponent(genre.name)}`}
            />
          ))}
          <MovieScrollRow
            title="Feel Good Movies"
            icon={Heart}
            movies={feelGood.results?.slice(0, 20) ?? []}
            seeMoreHref="/films/genre/35,10749?title=Feel+Good+Movies"
          />
          <MovieScrollRow
            title="Mind-Bending"
            icon={Brain}
            movies={mindBending.results?.slice(0, 20) ?? []}
            seeMoreHref="/films/genre/878,53?title=Mind-Bending"
          />

          {recentReviews.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-cinema-400" />
                <h2 className="text-lg font-semibold">What People Are Saying</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review as any}
                    showMovie
                    currentUserId={userId}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
              tab === id
                ? 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-transparent'
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/pick-tonight"
          className="rounded-full px-4 py-1.5 text-sm font-medium border border-cinema-500/30 text-cinema-400 hover:bg-cinema-500/10 transition-colors flex items-center gap-1.5"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Tonight
        </Link>
      </div>

      {content}
    </div>
  )
}
