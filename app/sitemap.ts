import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://watchdat.app'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/films`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/search`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const movies = await prisma.movie.findMany({
    select: { tmdbId: true, cachedAt: true },
    orderBy: { cachedAt: 'desc' },
    take: 1000,
  })

  const movieRoutes: MetadataRoute.Sitemap = movies.map((movie) => ({
    url: `${baseUrl}/film/${movie.tmdbId}`,
    lastModified: movie.cachedAt ?? undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const users = await prisma.user.findMany({
    select: { username: true, joinDate: true },
    take: 500,
  })

  const userRoutes: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${baseUrl}/user/${user.username}`,
    lastModified: user.joinDate ?? undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...movieRoutes, ...userRoutes]
}
