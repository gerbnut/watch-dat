import { auth } from '@/auth'
import { getOrCacheMovie, getWatchProviders, getMovieVideos, pickBestTrailer, TMDB_IMAGE } from '@/lib/tmdb'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { formatRuntime, getYearFromDate, getInitials } from '@/lib/utils'
import { Star, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogFilmButtonClient } from './LogFilmButtonClient'
import { WatchlistButtonClient } from './WatchlistButtonClient'
import { RecommendButtonClient } from './RecommendButtonClient'
import { TrailerButtonClient } from './TrailerButtonClient'
import { BackButton } from '@/components/ui/BackButton'
import { ShareButton } from '@/components/ui/ShareButton'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { ExternalLink } from '@/components/ui/ExternalLink'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const tmdbId = Number(id)
  if (isNaN(tmdbId)) return { title: 'Film Not Found' }
  try {
    const movie = await getOrCacheMovie(tmdbId)
    const year = getYearFromDate(movie.releaseDate)
    const pageTitle = year ? `${movie.title} (${year})` : movie.title
    const description = movie.overview ?? 'Track, rate, and review this film on Watch Dat.'
    const posterUrl = TMDB_IMAGE.poster(movie.poster, 'w500')
    const images = posterUrl ? [{ url: posterUrl, width: 500, height: 750, alt: movie.title }] : []
    return {
      title: pageTitle,
      description,
      openGraph: {
        title: `${pageTitle} — Watch Dat`,
        description,
        images,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${pageTitle} — Watch Dat`,
        description: movie.overview?.slice(0, 200) ?? undefined,
        images: posterUrl ? [posterUrl] : [],
      },
    }
  } catch {
    return { title: 'Film' }
  }
}

export default async function FilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tmdbId = Number(id)
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

  const [watchCount, watchProvidersData, watchlistItem, videosData] = await Promise.all([
    prisma.diaryEntry.count({ where: { movieId: movie.id } }),
    getWatchProviders(tmdbId).catch(() => null),
    session?.user?.id
      ? prisma.watchlistItem.findUnique({
          where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
        })
      : null,
    getMovieVideos(tmdbId).catch(() => null),
  ])
  const trailer = videosData ? pickBestTrailer(videosData.results) : null
  const streamingProviders = watchProvidersData?.results?.['US'] ?? null
  const isOnWatchlist = !!watchlistItem

  const HERO_BLUR_URL = `data:image/svg+xml;base64,${Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111827"/></svg>'
  ).toString('base64')}`

  const backdropUrl = TMDB_IMAGE.backdrop(movie.backdrop, 'w780')
  const genres = (movie.genres as any[]) ?? []
  const directors = (movie.directors as any[]) ?? []
  const cast = (movie.cast as any[]) ?? []
  const avgRating = reviewStats._avg.rating

  // Deduplicate friends by userId (keep most recent watch)
  const uniqueFriendsWatched = Array.from(
    new Map((friendsWatched as any[]).map((e) => [e.userId, e])).values()
  ).slice(0, 8)

  return (
    <div className="-mt-6">
      {/* ── Hero Section ── */}
      <div className="relative -mx-4">
        {/* Backdrop */}
        <div className="relative h-[300px] sm:h-[400px] overflow-hidden">
          {backdropUrl ? (
            <>
              <Image
                src={backdropUrl}
                alt={movie.title}
                fill
                className="object-cover object-top"
                priority
                sizes="100vw"
                placeholder="blur"
                blurDataURL={HERO_BLUR_URL}
              />
              {/* Bottom gradient — fade into page */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
              {/* Left gradient — readability for text */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-muted to-background" />
          )}

          {/* Back button — floating glass over backdrop */}
          <div className="absolute top-4 left-4 z-10">
            <BackButton className="backdrop-blur-sm bg-black/30 border-white/[0.08] hover:bg-black/50 text-white hover:text-white" />
          </div>
        </div>

        {/* Poster + Info overlay — pulls up into the backdrop */}
        <div className="relative -mt-32 sm:-mt-40 z-10 px-4 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Poster */}
            <div className="w-32 sm:w-44 shrink-0 mx-auto sm:mx-0">
              <div className="relative overflow-hidden rounded-xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/[0.06] aspect-[2/3]">
                <MoviePoster
                  poster={movie.poster}
                  title={movie.title}
                  tmdbSize="w500"
                  sizes="(max-width: 640px) 128px, 176px"
                  priority
                />
              </div>
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0 space-y-2.5 sm:pt-8 text-center sm:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{movie.title}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5 mt-1.5 text-sm text-muted-foreground/70">
                  {getYearFromDate(movie.releaseDate) && (
                    <span>{getYearFromDate(movie.releaseDate)}</span>
                  )}
                  {movie.runtime && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span>{formatRuntime(movie.runtime)}</span>
                    </>
                  )}
                  {genres.length > 0 && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span>{genres.map((g: any) => g.name).join(', ')}</span>
                    </>
                  )}
                </div>
              </div>

              {movie.tagline && (
                <p className="text-sm italic text-muted-foreground/60">"{movie.tagline}"</p>
              )}

              {directors.length > 0 && (
                <p className="text-sm text-muted-foreground/70">
                  Directed by{' '}
                  {directors.map((d: any, i: number) => (
                    <span key={d.id}>
                      {i > 0 && ', '}
                      <Link href={`/person/${d.id}`} className="text-cinema-400 hover:underline transition-colors">{d.name}</Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="mt-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.04] p-4 flex items-center gap-3 flex-wrap">
        <LogFilmButtonClient
          tmdbId={tmdbId}
          title={movie.title}
          posterPath={movie.poster}
          releaseDate={movie.releaseDate}
          existingRating={userReview?.rating ?? null}
          isLogged={!!userReview}
        />
        <WatchlistButtonClient tmdbId={tmdbId} isOnWatchlist={isOnWatchlist} />
        <RecommendButtonClient tmdbId={tmdbId} title={movie.title} />
        <TrailerButtonClient trailerKey={trailer?.key ?? null} />
        <div className="ml-auto">
          <ShareButton
            url={`/film/${tmdbId}`}
            title={`${movie.title} — Watch Dat`}
            text={movie.overview ?? undefined}
          />
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex items-center gap-6 py-4 mt-2">
        {avgRating && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-2xl font-bold text-cinema-400">
              <Star className="h-5 w-5 fill-cinema-400 stroke-none" />
              {avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">from {reviewStats._count.id} rating{reviewStats._count.id !== 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{watchCount.toLocaleString()} watched</span>
        </div>
        {uniqueFriendsWatched.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex -space-x-2">
              {uniqueFriendsWatched.slice(0, 5).map((entry: any) => (
                <Link key={entry.userId} href={`/user/${entry.user.username}`}>
                  <Avatar className="h-7 w-7 ring-2 ring-background hover:ring-cinema-500/40 transition-all">
                    <AvatarImage src={entry.user.avatar ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-cinema-900 text-cinema-300">
                      {getInitials(entry.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ))}
            </div>
            {uniqueFriendsWatched.length > 5 && (
              <span className="text-xs text-muted-foreground">+{uniqueFriendsWatched.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4">
        {/* Main column */}
        <div className="space-y-8 min-w-0">
          {/* Overview */}
          {movie.overview && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h2>
              <p className="text-sm leading-relaxed text-muted-foreground/80">{movie.overview}</p>
            </div>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cast</h2>
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-hide">
                {cast.slice(0, 12).map((actor: any) => (
                  <Link key={actor.id} href={`/person/${actor.id}`} className="shrink-0 w-20 space-y-1 text-center group snap-start">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted mx-auto ring-1 ring-white/[0.06] transition-transform duration-200 group-hover:scale-105 group-hover:ring-2 group-hover:ring-cinema-400">
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

          {/* Streaming — mobile only (also shown in sidebar on desktop) */}
          <div className="lg:hidden">
            {streamingProviders && (streamingProviders.flatrate?.length || streamingProviders.rent?.length || streamingProviders.buy?.length) ? (
              <StreamingSection streamingProviders={streamingProviders} />
            ) : null}
          </div>

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
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-8 text-center">
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block space-y-6">
          {/* Where to Watch */}
          {streamingProviders && (streamingProviders.flatrate?.length || streamingProviders.rent?.length || streamingProviders.buy?.length) ? (
            <StreamingSection streamingProviders={streamingProviders} />
          ) : null}

          {/* Film Details */}
          <div className="rounded-xl bg-card/50 border border-white/[0.03] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Details</h3>
            <dl className="space-y-2 text-sm">
              {movie.runtime && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground/60">Runtime</dt>
                  <dd>{formatRuntime(movie.runtime)}</dd>
                </div>
              )}
              {movie.releaseDate && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground/60">Released</dt>
                  <dd>{new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</dd>
                </div>
              )}
              {(movie as any).originalLanguage && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground/60">Language</dt>
                  <dd className="uppercase">{(movie as any).originalLanguage}</dd>
                </div>
              )}
            </dl>
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {genres.map((g: any) => (
                  <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Friends who watched */}
          {uniqueFriendsWatched.length > 0 && (
            <div className="rounded-xl bg-card/50 border border-white/[0.03] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Friends who watched</h3>
              <div className="space-y-2">
                {uniqueFriendsWatched.map((entry: any) => (
                  <Link
                    key={entry.userId}
                    href={`/user/${entry.user.username}`}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={entry.user.avatar ?? undefined} />
                      <AvatarFallback className="text-[9px] bg-cinema-900 text-cinema-300">
                        {getInitials(entry.user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{entry.user.displayName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ── Streaming Providers Section ── */
function StreamingSection({ streamingProviders }: { streamingProviders: any }) {
  const rentBuy = [
    ...(streamingProviders.rent ?? []),
    ...(streamingProviders.buy ?? []),
  ].filter((p: any, i: number, arr: any[]) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)

  return (
    <div className="rounded-xl bg-card/50 border border-white/[0.03] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Where to Watch</h3>

      {streamingProviders.flatrate && streamingProviders.flatrate.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground/60">Stream</p>
          <div className="flex flex-wrap gap-2">
            {streamingProviders.flatrate.map((p: any) => (
              <ExternalLink
                key={p.provider_id}
                href={streamingProviders.link}
                className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-sm font-medium hover:bg-white/[0.05] transition-colors"
                title={p.provider_name}
              >
                <Image
                  src={TMDB_IMAGE.logo(p.logo_path, 'w45')!}
                  alt={p.provider_name}
                  width={22}
                  height={22}
                  className="rounded-md"
                />
                {p.provider_name}
              </ExternalLink>
            ))}
          </div>
        </div>
      )}

      {rentBuy.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground/60">Rent / Buy</p>
          <div className="flex flex-wrap gap-1.5">
            {rentBuy.map((p: any) => (
              <ExternalLink
                key={p.provider_id}
                href={streamingProviders.link}
                className="flex items-center gap-1.5 rounded-md border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5 text-xs hover:bg-white/[0.05] transition-colors"
                title={p.provider_name}
              >
                <Image
                  src={TMDB_IMAGE.logo(p.logo_path, 'w45')!}
                  alt={p.provider_name}
                  width={18}
                  height={18}
                  className="rounded"
                />
                {p.provider_name}
              </ExternalLink>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40">US availability · Data provided by JustWatch</p>
    </div>
  )
}
