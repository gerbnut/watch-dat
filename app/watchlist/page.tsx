import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { MovieCard } from '@/components/movies/MovieCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'

export const metadata: Metadata = { title: 'Watchlist' }

export default async function WatchlistPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      movie: {
        select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true, genres: true },
      },
    },
    orderBy: { addedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground text-sm mt-1">{items.length} film{items.length !== 1 ? 's' : ''} to watch</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center space-y-4">
          <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <div className="space-y-1.5">
            <p className="font-medium">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground">Save films you want to watch — they'll all be here</p>
          </div>
          <Link href="/films">
            <Button variant="cinema" size="sm">Discover films</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {items.map(({ movie }) => (
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
      )}
    </div>
  )
}
