export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true } })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId: id } },
    })

    let liked: boolean
    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } })
      liked = false
    } else {
      await prisma.commentLike.create({
        data: { userId: session.user.id, commentId: id },
      })
      liked = true
    }

    const likeCount = await prisma.commentLike.count({ where: { commentId: id } })
    return NextResponse.json({ liked, likeCount })
  } catch (err) {
    console.error('Comment like error:', err)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
