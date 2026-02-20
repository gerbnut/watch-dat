export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { getOrCacheMovie } from '@/lib/tmdb'
import { z } from 'zod'

const reviewSchema = z.object({
  tmdbId: z.number().int().positive(),
  rating: z.number().min(1).max(10).multipleOf(0.5).optional().nullable(),
  text: z.string().max(10000).optional().nullable(),
  liked: z.boolean().optional(),
  hasSpoiler: z.boolean().optional(),
  watchedDate: z.string().optional().nullable(),
  rewatch: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { tmdbId, rating, text, liked, hasSpoiler, watchedDate, rewatch } = parsed.data
    const movie = await getOrCacheMovie(tmdbId)

    const review = await prisma.review.upsert({
      where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
      create: {
        userId: session.user.id,
        movieId: movie.id,
        rating: rating ?? null,
        text: text ?? null,
        liked: liked ?? false,
        hasSpoiler: hasSpoiler ?? false,
        watchedDate: watchedDate ? new Date(watchedDate) : null,
        rewatch: rewatch ?? false,
      },
      update: {
        rating: rating ?? null,
        text: text ?? null,
        liked: liked ?? false,
        hasSpoiler: hasSpoiler ?? false,
        watchedDate: watchedDate ? new Date(watchedDate) : null,
        rewatch: rewatch ?? false,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: true,
        _count: { select: { likes: true, comments: true } },
      },
    })

    // Add diary entry
    await prisma.diaryEntry.upsert({
      where: {
        id: `${session.user.id}_${movie.id}_${watchedDate ?? 'unset'}`,
      },
      create: {
        id: `${session.user.id}_${movie.id}_${watchedDate ?? 'unset'}`,
        userId: session.user.id,
        movieId: movie.id,
        watchedDate: watchedDate ? new Date(watchedDate) : new Date(),
        rating: rating ?? null,
        rewatch: rewatch ?? false,
        reviewId: review.id,
      },
      update: {
        rating: rating ?? null,
        rewatch: rewatch ?? false,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: text ? 'REVIEWED' : 'WATCHED',
        movieId: movie.id,
        reviewId: review.id,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (err) {
    console.error('Create review error:', err)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }
}
