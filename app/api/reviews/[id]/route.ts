export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

const updateSchema = z.object({
  rating: z.number().min(1).max(10).multipleOf(0.5).optional().nullable(),
  text: z.string().max(10000).optional().nullable(),
  liked: z.boolean().optional(),
  hasSpoiler: z.boolean().optional(),
  watchedDate: z.string().optional().nullable(),
  rewatch: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        watchedDate: parsed.data.watchedDate ? new Date(parsed.data.watchedDate) : undefined,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        movie: true,
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update review error:', err)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const review = await prisma.review.findUnique({ where: { id: params.id } })
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (review.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.review.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete review error:', err)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
