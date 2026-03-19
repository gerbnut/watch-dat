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
  getMovieVideos,
  pickBestTrailer,
  TMDBSearchResult,
} from '@/lib/tmdb'
import { getUserTopGenres, getUserWatchedTmdbIds } from '@/lib/user-genres'
import { MovieScrollRow } from '@/components/movies/MovieScrollRow'
import { NowPlayingRow } from '@/components/movies/NowPlayingRow'
import { TrendingCarousel } from '@/components/movies/TrendingCarousel'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import {
  TrendingUp,
  Star,
  Clapperboard,
  Shuffle,
  Sparkles,
  Heart,
  Skull,
  BookOpen,
  Search,
  Clock,
  Globe,
  Flame,
  Moon,
  Calendar,
  CalendarDays,
  Film,
  Palette,
  Trophy,
  Diamond,
  Eye,
  Swords,
  Zap,
  Crown,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Search' }

type Tab = 'popular' | 'new' | 'top-rated' | 'for-you'

function excludeWatched(movies: TMDBSearchResult[], watchedIds: Set<number>): TMDBSearchResult[] {
  return movies.filter((m) => !watchedIds.has(m.id))
}

function dedupeMovies(movies: TMDBSearchResult[]): TMDBSearchResult[] {
  const seen = new Set<number>()
  return movies.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

async function fetchRecentReviews(userId?: string) {
  return prisma.review.findMany({
    where: { text: { not: null }, rating: { gte: 7 } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      user: { select: { id: true, username: true, displayName: true, avatar: true } },
      movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })
}

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
    const [
      trending, popular, shortSweet,
      koreanGems, japaneseGems, frenchGems,
      slowBurn, animatedAdults, thisYear,
      nineties, warConflict, midnightMovies,
      recentReviews,
    ] = await Promise.all([
      getTrendingMovies('week'),
      getPopularMovies(),
      discoverMovies({ runtimeLte: 100, voteAverageGte: 7.0, minVotes: 300, sortBy: 'vote_average.desc' }),
      discoverMovies({ withOriginalLanguage: 'ko', voteAverageGte: 7.0, minVotes: 200, sortBy: 'vote_average.desc' }),
      discoverMovies({ withOriginalLanguage: 'ja', voteAverageGte: 7.0, minVotes: 200, sortBy: 'vote_average.desc' }),
      discoverMovies({ withOriginalLanguage: 'fr', voteAverageGte: 7.0, minVotes: 200, sortBy: 'vote_average.desc' }),
      discoverMovies({ withGenres: 53, runtimeGte: 120, voteAverageGte: 7.0, sortBy: 'vote_average.desc' }),
      discoverMovies({ withGenres: 16, withoutGenres: 10751, voteAverageGte: 7.0, sortBy: 'vote_average.desc' }),
      discoverMovies({ primaryReleaseYear: 2026, sortBy: 'popularity.desc', minVotes: 50 }),
      discoverMovies({ releaseDateGte: '1990-01-01', releaseDateLte: '1999-12-31', minVotes: 500, sortBy: 'vote_average.desc' }),
      discoverMovies({ withGenres: '10752,18', minVotes: 300, sortBy: 'vote_average.desc' }),
      discoverMovies({ withGenres: '27,53', voteAverageGte: 6.5, sortBy: 'popularity.desc' }),
      fetchRecentReviews(userId),
    ])

    const foreignGems = dedupeMovies([
      ...(koreanGems.results ?? []),
      ...(japaneseGems.results ?? []),
      ...(frenchGems.results ?? []),
    ]).slice(0, 20)

    // Fetch trailers for top 10 trending movies
    const trendingSlice: TMDBSearchResult[] = (trending.results ?? []).slice(0, 10)
    const trailerResults = await Promise.allSettled(
      trendingSlice.map((m: TMDBSearchResult) => getMovieVideos(m.id))
    )
    const trendingWithTrailers = trendingSlice.map((m: TMDBSearchResult, i: number) => {
      const vResult = trailerResults[i]
      const trailer = vResult.status === 'fulfilled' ? pickBestTrailer(vResult.value.results) : null
      return { ...m, trailerKey: trailer?.key ?? null }
    })

    content = (
      <div className="space-y-8">
        <TrendingCarousel movies={trendingWithTrailers} />
        <MovieScrollRow
          title="Popular Right Now"
          icon={Star}
          movies={popular.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Short & Sweet"
          icon={Clock}
          movies={shortSweet.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Foreign Language Gems"
          icon={Globe}
          movies={foreignGems}
        />
        <MovieScrollRow
          title="Slow Burn Thrillers"
          icon={Flame}
          movies={slowBurn.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/53?title=Slow+Burn+Thrillers"
        />
        <MovieScrollRow
          title="Animated for Adults"
          icon={Palette}
          movies={animatedAdults.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/16?title=Animated+for+Adults"
        />
        <MovieScrollRow
          title="This Year's Hits"
          icon={Calendar}
          movies={thisYear.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="90s Nostalgia"
          icon={Film}
          movies={nineties.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="War & Conflict"
          icon={Swords}
          movies={warConflict.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/10752,18?title=War+%26+Conflict"
        />
        <MovieScrollRow
          title="Midnight Movies"
          icon={Moon}
          movies={midnightMovies.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/27,53?title=Midnight+Movies"
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
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const monthStart = `${yyyy}-${mm}-01`
    const monthEnd = `${yyyy}-${mm}-${new Date(yyyy, now.getMonth() + 1, 0).getDate()}`
    const today = `${yyyy}-${mm}-${dd}`
    const threeMonthsOut = new Date(now)
    threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3)
    const futureDate = `${threeMonthsOut.getFullYear()}-${String(threeMonthsOut.getMonth() + 1).padStart(2, '0')}-${String(threeMonthsOut.getDate()).padStart(2, '0')}`
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

    const empty = { results: [] as TMDBSearchResult[], total_pages: 0 }
    const settled = await Promise.allSettled([
      getNowPlayingMovies(),
      discoverMovies({ releaseDateGte: monthStart, releaseDateLte: monthEnd, minVotes: 10 }),
      discoverMovies({ releaseDateGte: today, releaseDateLte: futureDate, minVotes: 0 }),
      discoverMovies({ withGenres: '28,53', releaseDateGte: recentDate, minVotes: 50 }),
      discoverMovies({ withGenres: 27, releaseDateGte: recentDate, minVotes: 50 }),
      discoverMovies({ withGenres: 18, releaseDateGte: recentDate, voteAverageGte: 7.0, minVotes: 100 }),
    ])
    const [nowPlaying, openingThisMonth, comingSoon, freshAction, newHorror, newDramas] =
      settled.map((r) => (r.status === 'fulfilled' ? r.value : empty))

    content = (
      <div className="space-y-8">
        <NowPlayingRow
          title="Now Playing"
          icon={Clapperboard}
          movies={nowPlaying.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Opening This Month"
          icon={CalendarDays}
          movies={openingThisMonth.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Coming Soon"
          icon={Clock}
          movies={comingSoon.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Fresh Action & Thriller"
          icon={Flame}
          movies={freshAction.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/28,53?title=Fresh+Action+%26+Thriller"
        />
        <MovieScrollRow
          title="New Horror"
          icon={Skull}
          movies={newHorror.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/27?title=New+Horror"
        />
        <MovieScrollRow
          title="New Dramas Worth Watching"
          icon={Heart}
          movies={newDramas.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/18?title=New+Dramas+Worth+Watching"
        />
      </div>
    )
  } else if (tab === 'top-rated') {
    const [
      topRated, modernClassics, lastDecade,
      goldenAge, hiddenGems, bestShort, topDocs,
    ] = await Promise.all([
      getTopRatedMovies(),
      discoverMovies({ releaseDateGte: '2000-01-01', releaseDateLte: '2015-12-31', voteAverageGte: 7.5, minVotes: 2000, sortBy: 'vote_average.desc' }),
      discoverMovies({ releaseDateGte: '2016-01-01', releaseDateLte: '2025-12-31', voteAverageGte: 7.5, minVotes: 1000, sortBy: 'vote_average.desc' }),
      discoverMovies({ releaseDateLte: '1979-12-31', voteAverageGte: 7.5, minVotes: 500, sortBy: 'vote_average.desc' }),
      discoverMovies({ voteAverageGte: 7.5, minVotes: 200, sortBy: 'vote_average.desc', page: 3 }),
      discoverMovies({ runtimeLte: 90, voteAverageGte: 7.5, minVotes: 300, sortBy: 'vote_average.desc' }),
      discoverMovies({ withGenres: 99, voteAverageGte: 7.0, minVotes: 200, sortBy: 'vote_average.desc' }),
    ])

    content = (
      <div className="space-y-8">
        <MovieScrollRow
          title="All-Time Greats"
          icon={Trophy}
          movies={topRated.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Modern Classics (2000–2015)"
          icon={Film}
          movies={modernClassics.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Best of the Last Decade"
          icon={Star}
          movies={lastDecade.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Golden Age (Pre-1980)"
          icon={Crown}
          movies={goldenAge.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Hidden Gems"
          icon={Diamond}
          movies={hiddenGems.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Best Under 90 Minutes"
          icon={Zap}
          movies={bestShort.results?.slice(0, 20) ?? []}
        />
        <MovieScrollRow
          title="Highest Rated Documentaries"
          icon={BookOpen}
          movies={topDocs.results?.slice(0, 20) ?? []}
          seeMoreHref="/films/genre/99?title=Highest+Rated+Documentaries"
        />
      </div>
    )
  } else {
    // For You tab (authenticated)
    const [topGenres, watchedIds] = await Promise.all([
      getUserTopGenres(userId!, 5),
      getUserWatchedTmdbIds(userId!),
    ])

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
      const randomPage = Math.floor(Math.random() * 5) + 1
      const top2Genres = topGenres.slice(0, 2).map((g) => g.id).join(',')

      const [
        ...genreResults
      ] = await Promise.all([
        ...topGenres.map((g) => discoverMovies({ withGenres: g.id, sortBy: 'vote_average.desc' })),
      ])

      const [
        deepCuts, quickWatches, newInGenres,
        criticsPicks, surpriseMe, recentReviews,
      ] = await Promise.all([
        discoverMovies({ withGenres: topGenres[0].id, sortBy: 'vote_average.desc', page: 2 }),
        discoverMovies({ withGenres: topGenres[0].id, runtimeLte: 100, voteAverageGte: 7.0, sortBy: 'vote_average.desc' }),
        discoverMovies({ withGenres: top2Genres, releaseDateGte: '2025-01-01' }),
        discoverMovies({ voteAverageGte: 8.0, minVotes: 1000, sortBy: 'vote_average.desc' }),
        discoverMovies({ voteAverageGte: 7.0, minVotes: 300, page: randomPage }),
        fetchRecentReviews(userId),
      ])

      content = (
        <div className="space-y-8">
          {topGenres.map((genre, i) => (
            <MovieScrollRow
              key={genre.id}
              title={`Because you love ${genre.name}`}
              icon={Sparkles}
              movies={excludeWatched(genreResults[i].results?.slice(0, 20) ?? [], watchedIds)}
              seeMoreHref={`/films/genre/${genre.id}?title=Because+you+love+${encodeURIComponent(genre.name)}`}
            />
          ))}
          <MovieScrollRow
            title="Deep Cuts in Your Taste"
            icon={Eye}
            movies={excludeWatched(deepCuts.results?.slice(0, 20) ?? [], watchedIds)}
          />
          <MovieScrollRow
            title="Quick Watches For You"
            icon={Clock}
            movies={excludeWatched(quickWatches.results?.slice(0, 20) ?? [], watchedIds)}
          />
          <MovieScrollRow
            title="New in Your Genres"
            icon={CalendarDays}
            movies={excludeWatched(newInGenres.results?.slice(0, 20) ?? [], watchedIds)}
          />
          <MovieScrollRow
            title="Critics' Picks You Haven't Seen"
            icon={Trophy}
            movies={excludeWatched(criticsPicks.results?.slice(0, 20) ?? [], watchedIds)}
          />
          <MovieScrollRow
            title="Surprise Me"
            icon={Shuffle}
            movies={excludeWatched(surpriseMe.results?.slice(0, 20) ?? [], watchedIds)}
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
      {/* Search bar */}
      <MovieSearch
        placeholder="Search films, cast & crew, people..."
        showPeople
      />

      {/* Tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {tabs.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
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
          className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border border-cinema-500/30 text-cinema-400 hover:bg-cinema-500/10 transition-colors flex items-center gap-1.5"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Tonight
        </Link>
      </div>

      {content}
    </div>
  )
}
