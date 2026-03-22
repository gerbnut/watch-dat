import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { MovieCard } from '@/components/movies/MovieCard'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/BackButton'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { WatchlistControls } from './WatchlistControls'

export const metadata: Metadata = { title: 'Watchlist' }

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; genre?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { sort: rawSort, genre: rawGenre } = await searchParams
  const sort = ['added', 'title', 'newest', 'oldest'].includes(rawSort ?? '') ? rawSort! : 'added'
  const genreFilter = rawGenre || null

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      movie: {
        select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true, genres: true },
      },
    },
    orderBy: { addedAt: 'desc' },
  })

  // Extract unique genres from all watchlist movies
  const genreSet = new Set<string>()
  for (const item of items) {
    for (const g of (item.movie.genres as any[]) ?? []) {
      if (g?.name) genreSet.add(g.name)
    }
  }
  const allGenres = [...genreSet].sort()

  // Filter by genre
  let filtered = genreFilter
    ? items.filter((item) =>
        ((item.movie.genres as any[]) ?? []).some((g: any) => g?.name === genreFilter)
      )
    : items

  // Sort
  if (sort === 'title') {
    filtered = [...filtered].sort((a, b) => a.movie.title.localeCompare(b.movie.title))
  } else if (sort === 'newest') {
    filtered = [...filtered].sort((a, b) => {
      const da = a.movie.releaseDate ? new Date(a.movie.releaseDate).getTime() : 0
      const db = b.movie.releaseDate ? new Date(b.movie.releaseDate).getTime() : 0
      return db - da
    })
  } else if (sort === 'oldest') {
    filtered = [...filtered].sort((a, b) => {
      const da = a.movie.releaseDate ? new Date(a.movie.releaseDate).getTime() : Infinity
      const db = b.movie.releaseDate ? new Date(b.movie.releaseDate).getTime() : Infinity
      return da - db
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} film{filtered.length !== 1 ? 's' : ''}
            {genreFilter ? ` in ${genreFilter}` : ' to watch'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-12 text-center space-y-4">
          <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/20" />
          <div className="space-y-1.5">
            <p className="font-medium">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground">Save films you want to watch — they'll all be here</p>
          </div>
          <Link href="/films">
            <Button variant="cinema" size="sm">Discover films</Button>
          </Link>
        </div>
      ) : (
        <>
          <WatchlistControls
            genres={allGenres}
            currentSort={sort}
            currentGenre={genreFilter}
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map(({ movie }) => (
              <MovieCard
                key={movie.id}
                tmdbId={movie.tmdbId}
                title={movie.title}
                poster={movie.poster}
                releaseDate={movie.releaseDate}
                size="sm"
              />
            ))}
          </div>
          {filtered.length === 0 && genreFilter && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No {genreFilter} films in your watchlist
            </div>
          )}
        </>
      )}
    </div>
  )
}
