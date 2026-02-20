export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      select: { userId: true, _count: { select: { replies: true } } },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (comment._count.replies > 0) {
      // Soft-delete: preserve thread structure, show [deleted] placeholder
      await prisma.comment.update({
        where: { id: params.id },
        data: { deleted: true, text: null, gifUrl: null },
      })
      return NextResponse.json({ deleted: true, softDelete: true })
    } else {
      // Hard delete: no replies, safe to remove
      await prisma.comment.delete({ where: { id: params.id } })
      return NextResponse.json({ deleted: true, softDelete: false })
    }
  } catch (err) {
    console.error('Delete comment error:', err)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
