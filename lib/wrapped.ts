import { prisma } from './db'
import { getOrCacheMovie } from './tmdb'
import { OSCAR_BEST_PICTURE_IDS, OSCAR_BEST_PICTURE_COUNT } from './data/oscar-winners'

// ── Types ────────────────────────────────────────────────────────────────────

export interface MovieSlim {
  tmdbId: number
  title: string
  poster: string | null
  backdrop: string | null
}

interface UserSlim {
  username: string | null
  displayName: string | null
  avatar: string | null
}

export interface WrappedData {
  user: UserSlim & { id: string }
  totalFilms: number
  percentile: number // 0-100, lower = better (top X%)
  totalMinutes: number
  funComparison: string
  highestBudget: { movie: MovieSlim; budget: number } | null
  oscarStats: { watched: number; total: number; titles: string[] }
  dayOfWeek: { day: number; label: string; count: number }[]
  hottestTake: { movie: MovieSlim; userRating: number; avgRating: number } | null
  mostSleptOn: { movie: MovieSlim; userRating: number; avgRating: number } | null
  topCountries: { country: string; iso: string; count: number }[]
  lowestBudget: { movie: MovieSlim; budget: number } | null
  hiddenGem: { movie: MovieSlim; watcherCount: number } | null
  topGenre: { name: string; count: number; total: number } | null
  topCast: { id: number; name: string; profilePath: string | null; count: number }[]
  moodboard: { backdrop: string; title: string }[]
  friendCompatibility: { user: UserSlim; overlapPercent: number; sharedCount: number; sharedPosters: string[] } | null
  archetype: { label: string; description: string }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function generateFunComparison(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const lotrMarathons = Math.floor(totalMinutes / (558 + 563 + 558)) // extended editions
  const moonTrips = (totalMinutes / (3 * 24 * 60)).toFixed(1) // ~3 days to the moon
  const marvelMarathons = Math.floor(totalMinutes / (50 * 60)) // ~50 hrs for MCU

  if (lotrMarathons >= 2) return `That's ${lotrMarathons} full Lord of the Rings extended marathons`
  if (marvelMarathons >= 1) return `That's ${marvelMarathons} complete MCU marathon${marvelMarathons > 1 ? 's' : ''}`
  if (hours >= 72) return `That's ${moonTrips} trips to the Moon`
  if (hours >= 24) return `That's ${Math.floor(hours / 24)} full days of cinema`
  return `${hours} hours of pure cinema`
}

function determineArchetype(data: {
  topGenreName: string | null
  avgRating: number
  rewatchPercent: number
  totalFilms: number
  genreCount: number
  avgDeviation: number
  horrorPercent: number
}): { label: string; description: string } {
  const { topGenreName, avgRating, rewatchPercent, totalFilms, genreCount, avgDeviation, horrorPercent } = data

  if ((topGenreName === 'Fantasy' || topGenreName === 'Science Fiction') && avgRating > 7) {
    return { label: 'Fantasy Escapist Who Can\'t Handle Reality', description: 'You prefer your worlds with a little more magic and a lot less responsibility.' }
  }
  if (horrorPercent > 70) {
    return { label: 'Sleeps With the Lights On (And Loves It)', description: 'Jump scares are your love language. The scarier, the better.' }
  }
  if (rewatchPercent > 50) {
    return { label: 'Comfort Rewatcher Who Refuses to Move On', description: 'Why watch something new when the classics never let you down?' }
  }
  if (topGenreName === 'Drama' && avgRating > 8) {
    return { label: 'Certified Film School Dropout', description: 'You didn\'t go to film school, but you sure watch like you did.' }
  }
  if (totalFilms > 200 && genreCount >= 8) {
    return { label: 'The Omnivore Who\'ll Watch Anything', description: 'Genre? You don\'t discriminate. If it\'s on screen, it\'s on your list.' }
  }
  if (topGenreName === 'Romance') {
    return { label: 'Hopeless Romantic With Impossible Standards', description: 'You\'ve watched enough meet-cutes to know real life can\'t compete.' }
  }
  if (topGenreName === 'Documentary') {
    return { label: 'The One Who Brings Up Docs at Parties', description: '"Have you seen that documentary about..." — you, at every social gathering.' }
  }
  if (avgDeviation > 2.5) {
    return { label: 'Professional Contrarian', description: 'If everyone loves it, you\'re suspicious. If everyone hates it, you\'re intrigued.' }
  }
  if (topGenreName === 'Action' && totalFilms > 100) {
    return { label: 'Adrenaline Junkie With a Remote', description: 'Explosions, car chases, and one-liners — you\'re living vicariously and loving it.' }
  }
  if (topGenreName === 'Animation') {
    return { label: 'Animated Soul in a Live-Action World', description: 'You know the best stories don\'t need real actors to make you feel real things.' }
  }
  if (topGenreName === 'Thriller') {
    return { label: 'Edge-of-Seat Enthusiast', description: 'You live for the tension. Pause button? Never heard of it.' }
  }
  if (topGenreName === 'Comedy' && totalFilms > 50) {
    return { label: 'Laugh Track Addict', description: 'Life\'s too short for sad movies. You came here to have a good time.' }
  }
  return { label: 'Certified Cinephile', description: 'A well-rounded film lover with impeccable taste and an ever-growing watchlist.' }
}

// ── Enrichment ───────────────────────────────────────────────────────────────

async function enrichMoviesWithBudget(movieIds: string[], maxEnrich = 200): Promise<void> {
  // Find movies missing budget data
  const moviesNeedingEnrichment = await prisma.movie.findMany({
    where: { id: { in: movieIds }, budget: null },
    select: { tmdbId: true },
    take: maxEnrich,
  })

  if (moviesNeedingEnrichment.length === 0) return

  // Batch in chunks of 5 for TMDB rate limiting
  const chunks: number[][] = []
  for (let i = 0; i < moviesNeedingEnrichment.length; i += 5) {
    chunks.push(moviesNeedingEnrichment.slice(i, i + 5).map(m => m.tmdbId))
  }

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(tmdbId => getOrCacheMovie(tmdbId)))
  }
}

// ── Main Function ────────────────────────────────────────────────────────────

export async function getWrappedData(userId: string): Promise<WrappedData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatar: true },
  })
  if (!user) throw new Error('User not found')

  // Get all diary entries with movie data
  const allEntries = await prisma.diaryEntry.findMany({
    where: { userId },
    include: {
      movie: {
        select: {
          id: true, tmdbId: true, title: true, poster: true, backdrop: true,
          runtime: true, genres: true, cast: true, budget: true,
          productionCountries: true,
        },
      },
    },
    orderBy: { watchedDate: 'desc' },
  })

  const totalFilms = allEntries.length
  const movieIds = [...new Set(allEntries.map(e => e.movieId))]

  // Enrich movies missing budget/country data (one-time)
  await enrichMoviesWithBudget(movieIds)

  // Re-fetch enriched movie data for budget/countries
  const enrichedMovies = await prisma.movie.findMany({
    where: { id: { in: movieIds } },
    select: {
      id: true, tmdbId: true, title: true, poster: true, backdrop: true,
      runtime: true, genres: true, cast: true, budget: true,
      productionCountries: true,
    },
  })
  const movieMap = new Map(enrichedMovies.map(m => [m.id, m]))

  // ── Parallel queries ────────────────────────────────────────────────────

  const [
    allUserCounts,
    dayOfWeekRaw,
    platformAvgRatings,
    followedUserIds,
  ] = await Promise.all([
    // Percentile: all users' diary counts
    prisma.$queryRaw<{ userId: string; count: bigint }[]>`
      SELECT "userId", COUNT(*)::bigint as count
      FROM "DiaryEntry"
      GROUP BY "userId"
    `,
    // Day of week distribution
    prisma.$queryRaw<{ dow: number; count: bigint }[]>`
      SELECT EXTRACT(DOW FROM "watchedDate")::int as dow, COUNT(*)::bigint as count
      FROM "DiaryEntry"
      WHERE "userId" = ${userId}
      GROUP BY dow
      ORDER BY dow
    `,
    // Platform average ratings per movie (for hottest take / slept on)
    prisma.$queryRaw<{ movieId: string; avg_rating: number; count: bigint }[]>`
      SELECT "movieId", AVG(rating)::float as avg_rating, COUNT(*)::bigint as count
      FROM "Review"
      WHERE rating IS NOT NULL
      GROUP BY "movieId"
    `,
    // Friends (followed users)
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
  ])

  // ── Percentile ──────────────────────────────────────────────────────────

  const sortedCounts = allUserCounts.map(u => Number(u.count)).sort((a, b) => b - a)
  const userRank = sortedCounts.findIndex(c => c <= totalFilms) + 1
  const percentile = Math.max(1, Math.round((userRank / sortedCounts.length) * 100))

  // ── Watch time ──────────────────────────────────────────────────────────

  const totalMinutes = allEntries.reduce((sum, e) => sum + (e.movie.runtime ?? 0), 0)
  const funComparison = generateFunComparison(totalMinutes)

  // ── Budget slides ───────────────────────────────────────────────────────

  let highestBudget: WrappedData['highestBudget'] = null
  let lowestBudget: WrappedData['lowestBudget'] = null

  const moviesWithBudget = enrichedMovies.filter(m => m.budget && m.budget > 0)
  if (moviesWithBudget.length > 0) {
    const sorted = [...moviesWithBudget].sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))
    const highest = sorted[0]
    const lowest = sorted[sorted.length - 1]
    highestBudget = {
      movie: { tmdbId: highest.tmdbId, title: highest.title, poster: highest.poster, backdrop: highest.backdrop },
      budget: highest.budget!,
    }
    lowestBudget = {
      movie: { tmdbId: lowest.tmdbId, title: lowest.title, poster: lowest.poster, backdrop: lowest.backdrop },
      budget: lowest.budget!,
    }
    // Don't show both if same movie
    if (highest.tmdbId === lowest.tmdbId) lowestBudget = null
  }

  // ── Oscar stats ─────────────────────────────────────────────────────────

  const watchedTmdbIds = new Set(enrichedMovies.map(m => m.tmdbId))
  const oscarWatched = OSCAR_BEST_PICTURE_IDS.filter(id => watchedTmdbIds.has(id))
  const oscarTitles = oscarWatched.map(id => enrichedMovies.find(m => m.tmdbId === id)?.title ?? '')

  // ── Day of week ─────────────────────────────────────────────────────────

  const dayOfWeek = DAY_LABELS.map((label, i) => {
    const found = dayOfWeekRaw.find(d => d.dow === i)
    return { day: i, label, count: found ? Number(found.count) : 0 }
  })

  // ── Hottest take & most slept on ────────────────────────────────────────

  const platformAvgMap = new Map(platformAvgRatings.map(r => [r.movieId, { avg: r.avg_rating, count: Number(r.count) }]))

  // Get user's reviews with ratings
  const userReviews = await prisma.review.findMany({
    where: { userId, rating: { not: null } },
    select: { movieId: true, rating: true },
  })

  let hottestTake: WrappedData['hottestTake'] = null
  let mostSleptOn: WrappedData['mostSleptOn'] = null
  let maxAbsDelta = 0
  let maxPositiveDelta = 0

  for (const review of userReviews) {
    if (!review.rating) continue
    const platformData = platformAvgMap.get(review.movieId)
    if (!platformData || platformData.count < 2) continue

    const delta = review.rating - platformData.avg
    const absDelta = Math.abs(delta)
    const movie = movieMap.get(review.movieId)
    if (!movie) continue

    const slim: MovieSlim = { tmdbId: movie.tmdbId, title: movie.title, poster: movie.poster, backdrop: movie.backdrop }

    if (absDelta > maxAbsDelta) {
      maxAbsDelta = absDelta
      hottestTake = { movie: slim, userRating: review.rating, avgRating: Math.round(platformData.avg * 10) / 10 }
    }
    if (delta > maxPositiveDelta && review.rating >= 7 && platformData.avg <= 6) {
      maxPositiveDelta = delta
      mostSleptOn = { movie: slim, userRating: review.rating, avgRating: Math.round(platformData.avg * 10) / 10 }
    }
  }

  // ── Top countries ───────────────────────────────────────────────────────

  const countryCount = new Map<string, { name: string; iso: string; count: number }>()
  for (const movie of enrichedMovies) {
    const countries = movie.productionCountries as { iso_3166_1: string; name: string }[] | null
    if (!countries) continue
    for (const c of countries) {
      const existing = countryCount.get(c.iso_3166_1)
      if (existing) {
        existing.count++
      } else {
        countryCount.set(c.iso_3166_1, { name: c.name, iso: c.iso_3166_1, count: 1 })
      }
    }
  }
  const topCountries = [...countryCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(c => ({ country: c.name, iso: c.iso, count: c.count }))

  // ── Hidden gem ──────────────────────────────────────────────────────────

  const movieWatchCounts = await prisma.$queryRaw<{ movieId: string; count: bigint }[]>`
    SELECT "movieId", COUNT(DISTINCT "userId")::bigint as count
    FROM "DiaryEntry"
    WHERE "movieId" = ANY(${movieIds})
    GROUP BY "movieId"
    ORDER BY count ASC
    LIMIT 1
  `
  let hiddenGem: WrappedData['hiddenGem'] = null
  if (movieWatchCounts.length > 0) {
    const gem = movieWatchCounts[0]
    const movie = movieMap.get(gem.movieId)
    if (movie && Number(gem.count) <= 3) {
      hiddenGem = {
        movie: { tmdbId: movie.tmdbId, title: movie.title, poster: movie.poster, backdrop: movie.backdrop },
        watcherCount: Number(gem.count),
      }
    }
  }

  // ── Top genre ───────────────────────────────────────────────────────────

  const genreCount = new Map<string, number>()
  for (const movie of enrichedMovies) {
    const genres = movie.genres as { id: number; name: string }[] | null
    if (!genres) continue
    for (const g of genres) {
      genreCount.set(g.name, (genreCount.get(g.name) ?? 0) + 1)
    }
  }
  const sortedGenres = [...genreCount.entries()].sort((a, b) => b[1] - a[1])
  const topGenre = sortedGenres.length > 0
    ? { name: sortedGenres[0][0], count: sortedGenres[0][1], total: totalFilms }
    : null

  // ── Top cast ────────────────────────────────────────────────────────────

  const castCount = new Map<number, { id: number; name: string; profilePath: string | null; count: number }>()
  for (const movie of enrichedMovies) {
    const cast = movie.cast as { id: number; name: string; character: string; profile_path: string | null }[] | null
    if (!cast) continue
    for (const actor of cast.slice(0, 5)) { // top 5 billed per movie
      const existing = castCount.get(actor.id)
      if (existing) {
        existing.count++
      } else {
        castCount.set(actor.id, { id: actor.id, name: actor.name, profilePath: actor.profile_path, count: 1 })
      }
    }
  }
  const topCast = [...castCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── Moodboard ───────────────────────────────────────────────────────────

  // Top-rated movies with backdrops
  const ratedEntries = allEntries
    .filter(e => e.rating && e.movie.backdrop)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  const seenBackdrops = new Set<string>()
  const moodboard: { backdrop: string; title: string }[] = []
  for (const entry of ratedEntries) {
    if (moodboard.length >= 6) break
    if (!entry.movie.backdrop || seenBackdrops.has(entry.movie.backdrop)) continue
    seenBackdrops.add(entry.movie.backdrop)
    moodboard.push({ backdrop: entry.movie.backdrop, title: entry.movie.title })
  }

  // ── Friend compatibility ────────────────────────────────────────────────

  let friendCompatibility: WrappedData['friendCompatibility'] = null
  const friendIds = followedUserIds.map(f => f.followingId)

  if (friendIds.length > 0) {
    const friendWatches = await prisma.$queryRaw<{ userId: string; movieId: string }[]>`
      SELECT DISTINCT "userId", "movieId"
      FROM "DiaryEntry"
      WHERE "userId" = ANY(${friendIds})
    `

    const friendMovieMap = new Map<string, Set<string>>()
    for (const fw of friendWatches) {
      if (!friendMovieMap.has(fw.userId)) friendMovieMap.set(fw.userId, new Set())
      friendMovieMap.get(fw.userId)!.add(fw.movieId)
    }

    const userMovieSet = new Set(movieIds)
    let bestFriendId: string | null = null
    let bestOverlap = 0
    let bestShared: string[] = []

    for (const [fId, fMovies] of friendMovieMap) {
      const shared = [...fMovies].filter(m => userMovieSet.has(m))
      const overlapPercent = Math.round((shared.length / Math.max(userMovieSet.size, fMovies.size)) * 100)
      if (shared.length > bestOverlap) {
        bestOverlap = shared.length
        bestFriendId = fId
        bestShared = shared.slice(0, 5)
      }
    }

    if (bestFriendId && bestOverlap > 0) {
      const friend = await prisma.user.findUnique({
        where: { id: bestFriendId },
        select: { username: true, displayName: true, avatar: true },
      })
      if (friend) {
        const sharedMovies = await prisma.movie.findMany({
          where: { id: { in: bestShared } },
          select: { poster: true },
        })
        const totalMovies = Math.max(userMovieSet.size, friendMovieMap.get(bestFriendId)?.size ?? 0)
        friendCompatibility = {
          user: friend,
          overlapPercent: Math.round((bestOverlap / totalMovies) * 100),
          sharedCount: bestOverlap,
          sharedPosters: sharedMovies.map(m => m.poster).filter((p): p is string => !!p),
        }
      }
    }
  }

  // ── Archetype ───────────────────────────────────────────────────────────

  const rewatchCount = allEntries.filter(e => e.rewatch).length
  const rewatchPercent = totalFilms > 0 ? (rewatchCount / totalFilms) * 100 : 0
  const avgRating = userReviews.length > 0
    ? userReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / userReviews.length
    : 0

  // Average deviation from platform
  let totalDeviation = 0
  let deviationCount = 0
  for (const review of userReviews) {
    if (!review.rating) continue
    const platformData = platformAvgMap.get(review.movieId)
    if (!platformData) continue
    totalDeviation += Math.abs(review.rating - platformData.avg)
    deviationCount++
  }
  const avgDeviation = deviationCount > 0 ? totalDeviation / deviationCount : 0

  const horrorCount = enrichedMovies.filter(m => {
    const genres = m.genres as { id: number; name: string }[] | null
    return genres?.some(g => g.name === 'Horror')
  }).length
  const horrorPercent = enrichedMovies.length > 0 ? (horrorCount / enrichedMovies.length) * 100 : 0

  const archetype = determineArchetype({
    topGenreName: topGenre?.name ?? null,
    avgRating,
    rewatchPercent,
    totalFilms,
    genreCount: genreCount.size,
    avgDeviation,
    horrorPercent,
  })

  return {
    user,
    totalFilms,
    percentile,
    totalMinutes,
    funComparison,
    highestBudget,
    oscarStats: { watched: oscarWatched.length, total: OSCAR_BEST_PICTURE_COUNT, titles: oscarTitles },
    dayOfWeek,
    hottestTake,
    mostSleptOn,
    topCountries,
    lowestBudget,
    hiddenGem,
    topGenre,
    topCast,
    moodboard,
    friendCompatibility,
    archetype,
  }
}
