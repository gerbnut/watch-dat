export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { sendPushToUser } from '@/lib/webpush'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_reviewId: { userId: session.user.id, reviewId: params.id } },
    })

    let liked: boolean
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      liked = false
    } else {
      await prisma.like.create({
        data: { userId: session.user.id, reviewId: params.id },
      })
      liked = true

      // Notify review author (not self-likes)
      const [review, actor] = await Promise.all([
        prisma.review.findUnique({
          where: { id: params.id },
          select: { userId: true, movie: { select: { title: true } } },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { displayName: true },
        }),
      ])
      if (review && review.userId !== session.user.id) {
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: review.userId,
              actorId: session.user.id,
              type: 'LIKED_REVIEW',
              reviewId: params.id,
            },
          }),
          sendPushToUser(review.userId, {
            title: 'New like',
            body: `${actor?.displayName ?? 'Someone'} liked your review of ${review.movie?.title ?? 'a film'}`,
            url: `/review/${params.id}`,
          }),
        ])
      }
    }

    const likeCount = await prisma.like.count({ where: { reviewId: params.id } })
    return NextResponse.json({ liked, likeCount })
  } catch (err) {
    console.error('Like error:', err)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
