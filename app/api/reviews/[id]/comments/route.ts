export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const commentSchema = z
  .object({
    text: z.string().max(500).optional(),
    parentId: z.string().optional(),
    gifUrl: z
      .string()
      .url('Invalid GIF URL')
      .refine((u) => u.includes('giphy.com'), 'GIF must be from GIPHY')
      .optional(),
  })
  .refine((d) => (d.text?.trim().length ?? 0) > 0 || !!d.gifUrl, {
    message: 'Comment must have text or a GIF',
  })

/** Parse @username mentions from comment text, returning matched usernames. */
function extractMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g) ?? []
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())))
}

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

    const { text, parentId, gifUrl } = parsed.data

    // Validate parentId belongs to the same review
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { reviewId: true },
      })
      if (!parent || parent.reviewId !== params.id) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        reviewId: params.id,
        parentId: parentId ?? null,
        text: text?.trim() ?? null,
        gifUrl: gifUrl ?? null,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    })

    // Fetch review for notifications
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    const notifications: Prisma.NotificationCreateManyInput[] = []

    if (parentId) {
      // Notify parent comment author (reply notification)
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      })
      if (parent && parent.userId !== session.user.id) {
        notifications.push({
          userId: parent.userId,
          actorId: session.user.id,
          type: 'REPLIED_COMMENT',
          reviewId: params.id,
          commentId: comment.id,
        })
      }
    } else if (review && review.userId !== session.user.id) {
      // Notify review author (top-level comment)
      notifications.push({
        userId: review.userId,
        actorId: session.user.id,
        type: 'COMMENTED_REVIEW',
        reviewId: params.id,
        commentId: comment.id,
      })
    }

    // Notify @mentioned users (skip anyone already getting a notification above)
    const mentionedUsernames = text ? extractMentions(text) : []
    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentionedUsernames } },
        select: { id: true },
      })
      const alreadyNotified = new Set(notifications.map((n) => n.userId))
      for (const mu of mentionedUsers) {
        if (mu.id !== session.user.id && !alreadyNotified.has(mu.id)) {
          notifications.push({
            userId: mu.id,
            actorId: session.user.id,
            type: 'MENTION',
            reviewId: params.id,
            commentId: comment.id,
          })
        }
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('Comment error:', err)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}
