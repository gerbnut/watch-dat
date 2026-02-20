export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_reviewId: { userId: session.user.id, reviewId: params.id } },
    })

    if (existing) {
      // Unlike
      await prisma.like.delete({ where: { id: existing.id } })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.like.create({
        data: { userId: session.user.id, reviewId: params.id },
      })

      // Notify review author
      const review = await prisma.review.findUnique({
        where: { id: params.id },
        select: { userId: true },
      })
      if (review && review.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: review.userId,
            actorId: session.user.id,
            type: 'LIKED_REVIEW',
            reviewId: params.id,
          },
        })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error('Like error:', err)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
