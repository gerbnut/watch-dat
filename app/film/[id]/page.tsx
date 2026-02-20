import { auth } from '@/auth'
import { getOrCacheMovie, TMDB_IMAGE } from '@/lib/tmdb'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { formatRuntime, getYearFromDate, formatRating, getInitials, cn } from '@/lib/utils'
import { Clock, Users, Eye, Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/movies/StarRating'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogFilmButtonClient } from './LogFilmButtonClient'
import { WatchlistButtonClient } from './WatchlistButtonClient'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) return { title: 'Film Not Found' }
  try {
    const movie = await getOrCacheMovie(tmdbId)
    return {
      title: `${movie.title} (${getYearFromDate(movie.releaseDate)})`,
      description: movie.overview ?? undefined,
    }
  } catch {
    return { title: 'Film' }
  }
}

export default async function FilmPage({ params }: { params: { id: string } }) {
  const tmdbId = Number(params.id)
  if (isNaN(tmdbId)) notFound()

  const session = await auth()

  let movie: any
  try {
    movie = await getOrCacheMovie(tmdbId)
  } catch {
    notFound()
  }

  const [reviewStats, recentReviews, userReview, friendsWatched] = await Promise.all([
    prisma.review.aggregate({
      where: { movieId: movie.id, rating: { not: null } },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.review.findMany({
      where: { movieId: movie.id, text: { not: null } },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    session?.user?.id
      ? prisma.review.findUnique({
          where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
        })
      : null,
    session?.user?.id
      ? prisma.diaryEntry.findMany({
          where: {
            movieId: movie.id,
            user: { followers: { some: { followerId: session.user.id } } },
          },
          include: {
            user: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
          orderBy: { watchedDate: 'desc' },
          take: 20,
        })
      : [],
  ])

  const watchCount = await prisma.diaryEntry.count({ where: { movieId: movie.id } })
  const isOnWatchlist = session?.user?.id
    ? !!(await prisma.watchlistItem.findUnique({
        where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
      }))
    : false

  const backdropUrl = TMDB_IMAGE.backdrop(movie.backdrop, 'w1280')
  const posterUrl = TMDB_IMAGE.poster(movie.poster, 'w500')
  const genres = (movie.genres as any[]) ?? []
  const directors = (movie.directors as any[]) ?? []
  const cast = (movie.cast as any[]) ?? []
  const avgRating = reviewStats._avg.rating

  // Deduplicate friends by userId (keep most recent watch)
  const uniqueFriendsWatched = Array.from(
    new Map((friendsWatched as any[]).map((e) => [e.userId, e])).values()
  ).slice(0, 8)

  return (
    <div className="space-y-8 -mt-6">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="relative -mx-4 h-72 sm:h-96 overflow-hidden">
          <Image src={backdropUrl} alt={movie.title} fill className="object-cover object-top" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      {/* Main info */}
      <div className={cn('flex gap-6', backdropUrl && '-mt-32 relative z-10')}>
        {/* Poster */}
        <div className="relative w-32 sm:w-44 shrink-0">
          <div className="relative overflow-hidden rounded-lg shadow-2xl aspect-[2/3]">
            {posterUrl ? (
              <Image src={posterUrl} alt={movie.title} fill className="object-cover" priority sizes="200px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
                <Eye className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-3 pt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
              {getYearFromDate(movie.releaseDate) && (
                <span>{getYearFromDate(movie.releaseDate)}</span>
              )}
              {movie.runtime && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRuntime(movie.runtime)}
                  </span>
                </>
              )}
              {directors.length > 0 && (
                <>
                  <span>·</span>
                  <span>
                    Directed by{' '}
                    {directors.map((d: any, i: number) => (
                      <span key={d.id}>
                        {i > 0 && ', '}
                        <Link href={`/person/${d.id}`} className="text-foreground font-medium hover:text-cinema-400 transition-colors">{d.name}</Link>
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
          </div>

          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g: any) => (
                <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
              ))}
            </div>
          )}

          {movie.tagline && (
            <p className="text-sm italic text-muted-foreground">"{movie.tagline}"</p>
          )}

          {/* Community stats */}
          <div className="flex flex-wrap items-center gap-4 py-2">
            {avgRating && (
              <div className="flex items-center gap-2">
                <StarRating value={avgRating} readOnly size="sm" showValue />
                <span className="text-xs text-muted-foreground">({reviewStats._count.id} ratings)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{watchCount.toLocaleString()} watched</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <LogFilmButtonClient
              tmdbId={tmdbId}
              title={movie.title}
              posterPath={movie.poster}
              releaseDate={movie.releaseDate}
              existingRating={userReview?.rating ?? null}
              isLogged={!!userReview}
            />
            <WatchlistButtonClient tmdbId={tmdbId} isOnWatchlist={isOnWatchlist} />
          </div>
        </div>
      </div>

      {/* Overview */}
      {movie.overview && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h2>
          <p className="leading-relaxed text-sm sm:text-base">{movie.overview}</p>
        </div>
      )}

      {/* Cast */}
      {cast.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cast</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {cast.slice(0, 12).map((actor: any) => (
              <Link key={actor.id} href={`/person/${actor.id}`} className="shrink-0 w-20 space-y-1 text-center group">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted mx-auto transition-transform duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-cinema-400">
                  {actor.profile_path ? (
                    <Image
                      src={TMDB_IMAGE.profile(actor.profile_path, 'w185')!}
                      alt={actor.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-xl">
                      {actor.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium line-clamp-1 group-hover:text-cinema-400 transition-colors">{actor.name}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{actor.character}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Friends who watched */}
      {uniqueFriendsWatched.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Friends who watched
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {uniqueFriendsWatched.map((entry: any) => (
              <Link
                key={entry.userId}
                href={`/user/${entry.user.username}`}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 hover:bg-accent transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={entry.user.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-cinema-900 text-cinema-300">
                    {getInitials(entry.user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{entry.user.displayName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <Link href={`/film/${tmdbId}/reviews`} className="text-sm text-cinema-400 hover:underline">
            See all
          </Link>
        </div>

        {recentReviews.length > 0 ? (
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review as any}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  )
}
