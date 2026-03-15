import { prisma } from './db'
import { GENRE_MAP } from './tmdb'

const REVERSE_GENRE_MAP: Record<string, number> = Object.fromEntries(
  Object.entries(GENRE_MAP).map(([id, name]) => [name, Number(id)])
)

export async function getUserWatchedTmdbIds(userId: string): Promise<Set<number>> {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId },
    select: { movie: { select: { tmdbId: true } } },
  })
  return new Set(entries.map((e) => e.movie.tmdbId))
}

export async function getUserTopGenres(userId: string, limit = 5) {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId },
    select: { movie: { select: { genres: true } } },
  })

  const counts = new Map<string, number>()
  for (const entry of entries) {
    const genres = entry.movie.genres as { id: number; name: string }[]
    if (!Array.isArray(genres)) continue
    for (const g of genres) {
      counts.set(g.name, (counts.get(g.name) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({
      id: REVERSE_GENRE_MAP[name] ?? 0,
      name,
      count,
    }))
    .filter((g) => g.id !== 0)
}
