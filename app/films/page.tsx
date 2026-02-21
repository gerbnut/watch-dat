export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getTrendingMovies, getPopularMovies, getNowPlayingMovies, getTopRatedMovies } from '@/lib/tmdb'
import { MovieCard } from '@/components/movies/MovieCard'
import { TrendingUp, Star, Clapperboard, Shuffle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Films' }

type Tab = 'popular' | 'new' | 'top-rated'

const TABS = [
  { id: 'popular' as Tab, label: 'Popular', href: '/films' },
  { id: 'new' as Tab, label: 'New Releases', href: '/films?tab=new' },
  { id: 'top-rated' as Tab, label: 'Top Rated', href: '/films?tab=top-rated' },
]

export default async function FilmsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const tab: Tab =
    searchParams.tab === 'new' ? 'new'
    : searchParams.tab === 'top-rated' ? 'top-rated'
    : 'popular'

  let content: React.ReactNode

  if (tab === 'popular') {
    const [trending, popular] = await Promise.all([
      getTrendingMovies('week'),
      getPopularMovies(),
    ])
    content = (
      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-cinema-400" />
            <h2 className="text-lg font-semibold">Trending this week</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {trending.results?.slice(0, 16).map((movie: any) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.id}
                title={movie.title}
                poster={movie.poster_path}
                releaseDate={movie.release_date}
                rating={movie.vote_average}
                size="sm"
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-cinema-400" />
            <h2 className="text-lg font-semibold">Popular right now</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {popular.results?.slice(0, 16).map((movie: any) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.id}
                title={movie.title}
                poster={movie.poster_path}
                releaseDate={movie.release_date}
                rating={movie.vote_average}
                size="sm"
              />
            ))}
          </div>
        </section>
      </div>
    )
  } else if (tab === 'new') {
    const nowPlaying = await getNowPlayingMovies()
    content = (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clapperboard className="h-5 w-5 text-cinema-400" />
          <h2 className="text-lg font-semibold">Now Playing</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {nowPlaying.results?.slice(0, 20).map((movie: any) => (
            <MovieCard
              key={movie.id}
              tmdbId={movie.id}
              title={movie.title}
              poster={movie.poster_path}
              releaseDate={movie.release_date}
              rating={movie.vote_average}
              size="sm"
            />
          ))}
        </div>
      </section>
    )
  } else {
    const topRated = await getTopRatedMovies()
    content = (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-cinema-400" />
          <h2 className="text-lg font-semibold">Top Rated</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {topRated.results?.slice(0, 20).map((movie: any) => (
            <MovieCard
              key={movie.id}
              tmdbId={movie.id}
              title={movie.title}
              poster={movie.poster_path}
              releaseDate={movie.release_date}
              rating={movie.vote_average}
              size="sm"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-cinema-500 text-black'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/pick-tonight"
          className="rounded-full px-4 py-1.5 text-sm font-medium border border-cinema-500 text-cinema-400 hover:bg-cinema-500/10 transition-colors flex items-center gap-1.5"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Tonight
        </Link>
      </div>

      {content}
    </div>
  )
}
