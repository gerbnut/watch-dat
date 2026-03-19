import { MovieCard } from './MovieCard'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MovieScrollRowProps {
  title: string
  movies: { id: number; title: string; poster_path: string | null; release_date?: string; vote_average?: number }[]
  seeMoreHref?: string
  icon?: LucideIcon
}

export function MovieScrollRow({ title, movies, seeMoreHref, icon: Icon }: MovieScrollRowProps) {
  if (!movies.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-cinema-400" />}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="flex items-center gap-0.5 text-sm text-cinema-400 hover:text-cinema-300 transition-colors"
          >
            See more <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {movies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              tmdbId={movie.id}
              title={movie.title}
              poster={movie.poster_path}
              releaseDate={movie.release_date}
              rating={movie.vote_average}
              showRating
              size="sm"
              priority={i < 3}
              className="shrink-0"
            />
          ))}
        </div>
        <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
