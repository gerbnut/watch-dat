import { Metadata } from 'next'
import { discoverMovies, getTrendingMovies, GENRE_MAP } from '@/lib/tmdb'
import { MovieCard } from '@/components/movies/MovieCard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function getGenreTitle(slug: string, titleParam?: string): string {
  if (titleParam) return titleParam
  const ids = slug.split(',').map(Number)
  return ids.map((id) => GENRE_MAP[id]).filter(Boolean).join(' & ') || 'Films'
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ title?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { title } = await searchParams
  return { title: getGenreTitle(slug, title) }
}

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ title?: string; page?: string }>
}) {
  const { slug } = await params
  const { title: titleParam, page: pageParam } = await searchParams
  const title = getGenreTitle(slug, titleParam)
  const page = Math.max(1, Number(pageParam) || 1)

  let movies: any[] = []
  let totalPages = 1
  let fetchError = false

  try {
    if (slug === 'trending') {
      const data = await getTrendingMovies('week')
      movies = data.results ?? []
    } else {
      const data = await discoverMovies({ withGenres: slug, page })
      movies = data.results ?? []
      totalPages = Math.min(data.total_pages, 20)
    }
  } catch (err) {
    console.error('Genre page TMDB fetch failed:', err)
    fetchError = true
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/films"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Films
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{title}</h1>

      {fetchError ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-2">
          <p className="font-medium">Films temporarily unavailable</p>
          <p className="text-sm text-muted-foreground">Please try again later.</p>
        </div>
      ) : <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {movies.map((movie: any) => (
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
      </div>}

      {!fetchError && slug !== 'trending' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link
              href={`/films/genre/${slug}?title=${encodeURIComponent(titleParam ?? '')}&page=${page - 1}`}
              className="rounded-full px-4 py-2 text-sm font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/films/genre/${slug}?title=${encodeURIComponent(titleParam ?? '')}&page=${page + 1}`}
              className="rounded-full px-4 py-2 text-sm font-medium border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
