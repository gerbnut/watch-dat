import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getOrCacheMovie } from '@/lib/tmdb'
import { z } from 'zod'

const schema = z.object({
  tmdbIds: z.array(z.number().int().positive()).max(5),
})

export async function PUT(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: { id: true },
    })
    if (!user || user.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Cache all movies
    await Promise.all(parsed.data.tmdbIds.map((id) => getOrCacheMovie(id)))

    // Replace all favorites
    await prisma.favoriteMovie.deleteMany({ where: { userId: user.id } })

    if (parsed.data.tmdbIds.length > 0) {
      const movies = await prisma.movie.findMany({
        where: { tmdbId: { in: parsed.data.tmdbIds } },
        select: { id: true, tmdbId: true },
      })

      await prisma.favoriteMovie.createMany({
        data: parsed.data.tmdbIds.map((tmdbId, order) => ({
          userId: user.id,
          movieId: movies.find((m) => m.tmdbId === tmdbId)!.id,
          order,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update favorites' }, { status: 500 })
  }
}
