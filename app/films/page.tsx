export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getTrendingMovies, getPopularMovies, TMDB_IMAGE } from '@/lib/tmdb'
import { MovieCard } from '@/components/movies/MovieCard'
import { TrendingUp, Star, Clapperboard } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Films' }

export default async function FilmsPage() {
  const [trending, popular] = await Promise.all([
    getTrendingMovies('week'),
    getPopularMovies(),
  ])

  return (
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
              size="sm"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
