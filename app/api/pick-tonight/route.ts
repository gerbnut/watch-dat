export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import {
  GENRE_MAP,
  getTrendingMovies,
  getPopularMovies,
  discoverMovies,
  getSimilarMovies,
  TMDBSearchResult,
} from '@/lib/tmdb'

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const rawGenreId = searchParams.get('genreId')
  const rawPage = searchParams.get('page')

  let genreId: number | undefined
  if (rawGenreId !== null) {
    const parsed = parseInt(rawGenreId, 10)
    if (isNaN(parsed) || !(parsed in GENRE_MAP)) {
      return NextResponse.json({ error: 'Invalid genreId' }, { status: 400 })
    }
    genreId = parsed
  }

  const safePage = Math.min(rawPage ? Math.max(1, parseInt(rawPage, 10) || 1) : 1, 500)

  const session = await auth()
  const userId = session?.user?.id ?? null

  const watchedTmdbIds = new Set<number>()
  const friendRecMap = new Map<number, { username: string; avatar: string | null; rating: number }[]>()
  const favTmdbIds: number[] = []

  if (userId) {
    const [diary, follows, favorites] = await Promise.all([
      prisma.diaryEntry.findMany({
        where: { userId },
        take: 1000,
        select: { movie: { select: { tmdbId: true } } },
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      prisma.favoriteMovie.findMany({
        where: { userId },
        take: 5,
        orderBy: { order: 'asc' },
        include: { movie: { select: { tmdbId: true } } },
      }),
    ])

    for (const e of diary) watchedTmdbIds.add(e.movie.tmdbId)
    for (const f of favorites) favTmdbIds.push(f.movie.tmdbId)

    const followingIds = follows.map((f) => f.followingId)
    if (followingIds.length > 0) {
      const friendReviews = await prisma.review.findMany({
        where: { userId: { in: followingIds }, rating: { gte: 8 } },
        take: 200,
        include: {
          movie: { select: { tmdbId: true } },
          user: { select: { username: true, avatar: true } },
        },
      })
      for (const r of friendReviews) {
        const id = r.movie.tmdbId
        const existing = friendRecMap.get(id) ?? []
        existing.push({ username: r.user.username, avatar: r.user.avatar ?? null, rating: r.rating! })
        friendRecMap.set(id, existing)
      }
    }
  }

  // Pick up to 2 random favorites for similar-movie seeds
  const shuffledFavs = fisherYates(favTmdbIds)
  const [fav1, fav2] = shuffledFavs

  const promises: Promise<{ results: TMDBSearchResult[] }>[] = [
    getTrendingMovies('week'),
    getPopularMovies(safePage),
  ]
  if (genreId !== undefined) {
    promises.push(discoverMovies({ withGenres: genreId, page: safePage, minVotes: 200 }))
  }
  if (fav1) promises.push(getSimilarMovies(fav1))
  if (fav2) promises.push(getSimilarMovies(fav2))

  const settled = await Promise.allSettled(promises)

  const allResults: TMDBSearchResult[] = []
  const seenIds = new Set<number>()

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    for (const movie of result.value.results ?? []) {
      if (!seenIds.has(movie.id)) {
        seenIds.add(movie.id)
        allResults.push(movie)
      }
    }
  }

  const filtered = allResults.filter((m) => !watchedTmdbIds.has(m.id))
  const shuffled = fisherYates(filtered)
  const page20 = shuffled.slice(0, 20)
  const nextPage = shuffled.length > 20 ? safePage + 1 : null

  const movies = page20.map((m) => ({
    tmdbId: m.id,
    title: m.title,
    poster: m.poster_path,
    backdrop: m.backdrop_path,
    overview: m.overview,
    releaseDate: m.release_date ?? null,
    voteAverage: m.vote_average,
    genres: (m.genre_ids ?? [])
      .filter((id) => id in GENRE_MAP)
      .map((id) => ({ id, name: GENRE_MAP[id] })),
    friendRecs: friendRecMap.get(m.id) ?? [],
  }))

  return NextResponse.json({ movies, nextPage })
}
