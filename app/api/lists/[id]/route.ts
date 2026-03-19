export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await auth()
    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true } },
        items: {
          include: {
            movie: {
              select: {
                id: true,
                tmdbId: true,
                title: true,
                poster: true,
                releaseDate: true,
                genres: true,
                directors: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { items: true } },
      },
    })

    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Private list — only owner can view
    if (!list.isPublic && list.user.id !== session?.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(list)
  } catch (err) {
    console.error('List error:', err)
    return NextResponse.json({ error: 'Failed to load list' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id } })
    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const patchSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().optional(),
    })
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const updated = await prisma.list.update({
      where: { id },
      data: {
        name: parsed.data.name ?? undefined,
        description: parsed.data.description ?? undefined,
        isPublic: parsed.data.isPublic ?? undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update list error:', err)
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await prisma.list.findUnique({ where: { id } })
    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.list.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete list error:', err)
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
  }
}
