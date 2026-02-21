export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getOrCacheMovie } from '@/lib/tmdb'
import { z } from 'zod'

const sendSchema = z.object({
  recipientUsername: z.string().min(1),
  tmdbId: z.number().int().positive(),
  message: z.string().max(300).optional(),
})

// GET — received recommendations (inbox)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recs = await prisma.recommendation.findMany({
    where: { recipientId: session.user.id },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatar: true } },
      movie: { select: { id: true, tmdbId: true, title: true, poster: true, releaseDate: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Mark all as seen
  await prisma.recommendation.updateMany({
    where: { recipientId: session.user.id, seen: false },
    data: { seen: true },
  })

  return NextResponse.json(recs)
}

// POST — send a recommendation
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { recipientUsername, tmdbId, message } = parsed.data

  // Find recipient
  const recipient = await prisma.user.findUnique({
    where: { username: recipientUsername.toLowerCase() },
    select: { id: true },
  })
  if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (recipient.id === session.user.id) return NextResponse.json({ error: 'Cannot recommend to yourself' }, { status: 400 })

  // Cache the movie in DB
  await getOrCacheMovie(tmdbId)
  const movie = await prisma.movie.findUnique({ where: { tmdbId }, select: { id: true } })
  if (!movie) return NextResponse.json({ error: 'Movie not found' }, { status: 404 })

  // Upsert recommendation (allows updating message if already sent)
  await prisma.recommendation.upsert({
    where: {
      senderId_recipientId_movieId: {
        senderId: session.user.id,
        recipientId: recipient.id,
        movieId: movie.id,
      },
    },
    create: {
      senderId: session.user.id,
      recipientId: recipient.id,
      movieId: movie.id,
      message: message?.trim() || null,
      seen: false,
    },
    update: {
      message: message?.trim() || null,
      seen: false,
    },
  })

  // Create a notification for the recipient (fire and forget — duplicates are acceptable)
  await prisma.notification.create({
    data: {
      userId: recipient.id,
      actorId: session.user.id,
      type: 'RECOMMENDED_MOVIE',
      movieId: movie.id,
    },
  }).catch(() => {}) // Ignore if it fails

  return NextResponse.json({ success: true })
}
