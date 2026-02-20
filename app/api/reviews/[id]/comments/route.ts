export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

const commentSchema = z.object({
  text: z.string().min(1).max(2000),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: { reviewId: params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(comments)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = commentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        reviewId: params.id,
        text: parsed.data.text,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
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
          type: 'COMMENTED_REVIEW',
          reviewId: params.id,
        },
      })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}
