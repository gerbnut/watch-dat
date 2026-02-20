import { prisma } from './db'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000

export const TMDB_IMAGE = {
  poster: (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null,
  backdrop: (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null,
  profile: (path: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null,
}

async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', process.env.TMDB_API_KEY!)
  Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val))

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // ISR cache 1hr
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  runtime: number
  genres: { id: number; name: string }[]
  tagline: string
  original_language: string
  vote_average: number
  vote_count: number
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[]
    crew: { id: number; name: string; job: string; department: string }[]
  }
}

export interface TMDBSearchResult {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
}

export async function searchMovies(query: string, page = 1): Promise<{
  results: TMDBSearchResult[]
  total_pages: number
  total_results: number
}> {
  return tmdbFetch('/search/movie', { query, page: String(page), include_adult: 'false' })
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie> {
  return tmdbFetch(`/movie/${tmdbId}`, { append_to_response: 'credits' })
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week') {
  return tmdbFetch(`/trending/movie/${timeWindow}`)
}

export async function getPopularMovies(page = 1) {
  return tmdbFetch('/movie/popular', { page: String(page) })
}

export async function getNowPlayingMovies(page = 1) {
  return tmdbFetch('/movie/now_playing', { page: String(page) })
}

// Cache movie in DB to avoid redundant API calls
export async function getOrCacheMovie(tmdbId: number) {
  const existing = await prisma.movie.findUnique({
    where: { tmdbId },
  })

  const isStale =
    !existing || Date.now() - existing.cachedAt.getTime() > CACHE_DURATION_MS

  if (!isStale && existing) return existing

  const data = await getMovieDetails(tmdbId)

  const directors = data.credits?.crew
    .filter((c) => c.job === 'Director')
    .map((c) => ({ id: c.id, name: c.name })) ?? []

  const cast = data.credits?.cast
    .slice(0, 20)
    .map((c) => ({ id: c.id, name: c.name, character: c.character, profile_path: c.profile_path })) ?? []

  const movie = await prisma.movie.upsert({
    where: { tmdbId },
    update: {
      title: data.title,
      poster: data.poster_path,
      backdrop: data.backdrop_path,
      overview: data.overview,
      releaseDate: data.release_date ? new Date(data.release_date) : null,
      runtime: data.runtime ?? null,
      genres: data.genres ?? [],
      directors,
      cast,
      tagline: data.tagline ?? null,
      language: data.original_language ?? null,
      cachedAt: new Date(),
    },
    create: {
      id: String(tmdbId),
      tmdbId,
      title: data.title,
      poster: data.poster_path,
      backdrop: data.backdrop_path,
      overview: data.overview,
      releaseDate: data.release_date ? new Date(data.release_date) : null,
      runtime: data.runtime ?? null,
      genres: data.genres ?? [],
      directors,
      cast,
      tagline: data.tagline ?? null,
      language: data.original_language ?? null,
    },
  })

  return movie
}
